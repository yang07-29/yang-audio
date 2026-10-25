"""Reference-free global gain calibration and mixture-consistency projections.

Mixture consistency is an existing method (Wisdom et al., 2019,
https://arxiv.org/abs/1811.08521), applied here with explicit amplitude control.
No source reference or metric is used to choose a gain or residual weight.
"""

import numpy as np


METHODS = ("gain", "uniform", "energy")


def process(mixture, estimates, method="gain"):
    """Return ``(float64[2,N], metadata)`` using a single utterance-wide gain.

    ``g=<x,sum(y)>/||sum(y)||²``, ``z=g*y``, ``r=x-sum(z)``.
    The output is z, z+r/2, or z+E_k/sum(E)*r. For an exactly zero
    reconstruction use g=1; for zero calibrated source energy use equal
    weights. An orthogonal, nonzero reconstruction legitimately gives g=0.
    Such degeneracy is reported, not hidden by an arbitrary positive floor.
    """
    if method not in METHODS:
        raise ValueError(f"Unknown postprocessing method {method!r}; choose {METHODS}")
    for value in (mixture, estimates):
        if np.asarray(value).dtype.kind not in "iuf":
            raise ValueError("Audio must contain real numeric samples")
    x = np.asarray(mixture, dtype=np.float64)
    y = np.asarray(estimates, dtype=np.float64)
    if x.ndim != 1 or x.size < 2 or y.shape != (2, x.size):
        raise ValueError("Expected mixture[N] and estimates[2,N] of equal length")
    if not np.isfinite(x).all() or not np.isfinite(y).all():
        raise ValueError("Audio contains nonfinite samples")
    # Scale the regression to avoid squaring the arbitrary checkpoint gain.
    y_scale = float(np.max(np.abs(y)))
    x_scale = float(np.max(np.abs(x)))
    ys = y / y_scale if y_scale else y.copy()
    reconstruction = ys.sum(axis=0)
    denominator = float(np.dot(reconstruction, reconstruction))
    zero_sum = denominator == 0.0
    if zero_sum:
        gain = 1.0
        z = y.copy()
    elif x_scale == 0:
        gain = 0.0
        z = np.zeros_like(y)
    else:
        coefficient = float(np.dot(x / x_scale, reconstruction) / denominator)
        z = (ys * coefficient) * x_scale
        gain = coefficient * (x_scale / y_scale)
    if not np.isfinite(z).all() or not np.isfinite(gain):
        raise ValueError("Gain calibration exceeds floating-point range")
    residual = x - z.sum(axis=0)
    peak = float(np.max(np.abs(z)))
    energies = np.mean((z / peak) ** 2, axis=1) if peak else np.zeros(2)
    weights = energies / energies.sum() if energies.sum() else np.full(2, 0.5)
    applied = np.zeros(2) if method == "gain" else (np.full(2, 0.5) if method == "uniform" else weights)
    result = z + applied[:, None] * residual[None, :]
    remaining = x - result.sum(axis=0)
    # Typical audio is far from numeric limits; reject overflow explicitly.
    values = {
        "calibration_gain": float(gain),
        "weights": applied.tolist(),
        "energy_weights": weights.tolist(),
        "input_residual_rms": float(np.sqrt(np.mean(residual ** 2))),
        "output_residual_rms": float(np.sqrt(np.mean(remaining ** 2))),
        "output_residual_max": float(np.max(np.abs(remaining))),
        "mixture_rms": float(np.sqrt(np.mean(x ** 2))),
        "zero_reconstruction": bool(zero_sum),
        "zero_calibrated_energy": bool(not peak),
        "method": method,
    }
    if not np.isfinite(result).all() or not all(np.isfinite(values[k]) for k in (
        "input_residual_rms", "output_residual_rms", "output_residual_max", "mixture_rms"
    )):
        raise ValueError("Postprocessing exceeds floating-point range")
    return result, values
