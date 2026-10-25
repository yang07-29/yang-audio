"""Differentiable, zero-mean, utterance-level two-speaker PIT SI-SDR."""
import torch


def pairwise_si_sdr(estimates, references, eps=1e-12):
    """Return B x reference x estimate scores, with gain-independent floors.

    Float64 normalization matches the separately implemented NumPy evaluation
    definition. Conversion to float64 preserves autograd through float32 model
    outputs. Constant references are invalid; constant estimates score -120 dB.
    """
    if not (0 < eps < 1):
        raise ValueError("eps must be between zero and one")
    if estimates.ndim == 2 and references.ndim == 2:
        estimates, references = estimates.unsqueeze(0), references.unsqueeze(0)
    if estimates.ndim != 3 or references.shape != estimates.shape or estimates.shape[1] != 2:
        raise ValueError("Expected matching (batch, 2, samples) or (2, samples) tensors")
    if estimates.shape[0] == 0 or estimates.shape[-1] < 2:
        raise ValueError("SI-SDR needs a nonempty batch and at least two samples")
    if not torch.isfinite(estimates).all() or not torch.isfinite(references).all():
        raise ValueError("SI-SDR inputs must be finite")
    est, ref = estimates.double(), references.double()
    est = est - est.mean(dim=-1, keepdim=True)
    ref = ref - ref.mean(dim=-1, keepdim=True)
    est_norm = torch.linalg.vector_norm(est, dim=-1, keepdim=True)
    ref_norm = torch.linalg.vector_norm(ref, dim=-1, keepdim=True)
    if (ref_norm == 0).any():
        raise ValueError("References must have nonzero energy after mean removal")
    tiny = torch.finfo(torch.float64).tiny
    est = est / est_norm.clamp_min(tiny)
    ref = ref / ref_norm
    coefficients = torch.einsum("brt,bet->bre", ref, est)
    projection = coefficients.unsqueeze(-1) * ref.unsqueeze(2)
    residual = est.unsqueeze(1) - projection
    signal_energy = projection.square().sum(-1)
    noise_energy = residual.square().sum(-1)
    scores = 10 * torch.log10(signal_energy.clamp_min(eps) / noise_energy.clamp_min(eps))
    limit = -10 * torch.log10(torch.tensor(eps, dtype=scores.dtype, device=scores.device))
    scores = scores.clamp(min=-limit, max=limit)
    return torch.where((est_norm.squeeze(-1) == 0).unsqueeze(1), -limit, scores)


def pit_si_sdr(estimates, references, eps=1e-12):
    """Return the better complete utterance assignment for each batch item."""
    scores = pairwise_si_sdr(estimates, references, eps)
    identity = (scores[:, 0, 0] + scores[:, 1, 1]) / 2
    swapped = (scores[:, 0, 1] + scores[:, 1, 0]) / 2
    # Stable identity-first ties match the independent NumPy evaluator.
    return torch.where(identity >= swapped, identity, swapped)


def pit_si_sdr_loss(estimates, references):
    """Negative mean PIT SI-SDR, minimized by the optimizer."""
    return -pit_si_sdr(estimates, references).mean()
