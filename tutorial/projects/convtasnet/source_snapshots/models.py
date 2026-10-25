"""Load the preserved upstream architecture and select the adaptation head."""
from pathlib import Path

import torch

from speechsep.common import ROOT, read_json, sha256_file
from upstream.conv_tasnet import conv_tasnet_base


def load_model(checkpoint=None, device="cpu"):
    """Load official weights or this project's ``model_state`` checkpoint.

    No downloads or architecture substitutions take place here. Only tensors
    and safe built-in checkpoint values are accepted by ``weights_only=True``.
    """
    path = Path(checkpoint or "assets/conv_tasnet_base_libri2mix.pt")
    if not path.is_absolute():
        path = ROOT / path
    if not path.is_file():
        raise FileNotFoundError(f"Model checkpoint does not exist: {path}")
    if path.resolve() == (ROOT / "assets/conv_tasnet_base_libri2mix.pt").resolve():
        expected = read_json(ROOT / "assets/manifest.json")["assets/conv_tasnet_base_libri2mix.pt"]
        if path.stat().st_size != expected["bytes"] or sha256_file(path) != expected["sha256"]:
            raise ValueError(f"Official checkpoint failed its pinned size/SHA-256 check: {path}")
    state = torch.load(path, map_location="cpu", weights_only=True)
    if not isinstance(state, dict):
        raise ValueError(f"Checkpoint is not a state dictionary: {path}")
    state = state.get("model_state", state)
    model = conv_tasnet_base()
    model.load_state_dict(state, strict=True)
    return model.to(device).eval()


def configure_trainable(model):
    """Freeze the encoder/TCN and adapt only mask projection and decoder.

    The unchanged official base architecture has exactly 140,289 selected
    parameters. An architecture mismatch fails rather than silently changing
    the experimental intervention.
    """
    prefixes = ("mask_generator.output_prelu.", "mask_generator.output_conv.", "decoder.")
    names = []
    for name, parameter in model.named_parameters():
        parameter.requires_grad_(name.startswith(prefixes))
        if parameter.requires_grad:
            names.append(name)
    total = sum(parameter.numel() for parameter in model.parameters())
    trainable = sum(parameter.numel() for parameter in model.parameters() if parameter.requires_grad)
    if trainable != 140289:
        raise ValueError(f"Expected official adaptation head with 140289 parameters; got {trainable}")
    return {"total": total, "trainable": trainable, "fraction": trainable / total,
            "trainable_names": names, "frozen": total - trainable}
