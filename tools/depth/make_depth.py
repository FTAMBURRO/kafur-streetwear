"""Genera el mapa de profundidad del hero KAFUR con MiDaS-small (ONNX, CPU).

Uso:  python tools/depth/make_depth.py
Lee:  public/assets/hero-kafur.jpg
Escribe: public/assets/hero-kafur-depth.png (gris, blanco = cerca)

El modelo se descarga una sola vez a tools/depth/model-small.onnx
(MiDaS v2.1, MIT, https://github.com/isl-org/MiDaS).
"""
import os
import sys
import urllib.request

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(ROOT, "tools", "depth", "model-small.onnx")
MODEL_URL = "https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.onnx"
SRC = os.path.join(ROOT, "public", "assets", "hero-kafur.jpg")
DST = os.path.join(ROOT, "public", "assets", "hero-kafur-depth.png")


def ensure_model():
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 10_000_000:
        print("modelo OK (cache)")
        return
    print("descargando modelo MiDaS-small ...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("modelo descargado:", os.path.getsize(MODEL_PATH) // 1_000_000, "MB")


def main():
    ensure_model()
    import onnxruntime as ort

    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    print("entrada:", w, "x", h)

    # Preproceso MiDaS-small: 256x256 + normalización ImageNet.
    small = img.resize((256, 256), Image.BICUBIC)
    arr = np.asarray(small).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    tensor = np.transpose(arr, (2, 0, 1))[np.newaxis, ...].astype(np.float32)

    sess = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    pred = sess.run(None, {sess.get_inputs()[0].name: tensor})[0][0, 0]
    print("salida cruda: min=%.3f max=%.3f" % (pred.min(), pred.max()))

    # MiDaS v2.1 devuelve disparidad: mayor = más cerca. Upsample y
    # normalización lineal con recorte por percentiles (robusto a outliers).
    # Suave y sin ruido amplificado: ideal para el warp del fondo, donde la
    # zona media es coherente y el suelo aporta el gradiente cercano.
    # (La variante ecualizada vive en la rama DEPTH_MODE=equalize.)
    depth = np.asarray(Image.fromarray(pred).resize((w, h), Image.BICUBIC), dtype=np.float32)
    if os.environ.get("DEPTH_MODE", "linear") == "equalize":
        flat = depth.ravel()
        order = np.argsort(flat, kind="mergesort")
        rank = np.empty_like(order)
        rank[order] = np.arange(flat.size)
        depth = rank.reshape(depth.shape).astype(np.float32) / max(flat.size - 1, 1)
    else:
        lo, hi = np.percentile(depth, (1, 99))
        depth = np.clip((depth - lo) / max(hi - lo, 1e-6), 0, 1)
    out = Image.fromarray((depth * 255).astype(np.uint8), mode="L")
    out.save(DST)
    print("mapa guardado:", DST, "media=%.1f" % (depth.mean() * 255))

    # Diagnóstico rápido por bandas horizontales (cielo / muros-persona / suelo).
    bands = np.array_split(depth, 3, axis=0)
    print("medias sup/mid/inf:", " ".join("%.2f" % b.mean() for b in bands))


if __name__ == "__main__":
    sys.exit(main())
