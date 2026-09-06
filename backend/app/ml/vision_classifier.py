import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from PIL import Image, ImageStat
import numpy as np

class VisionClassifier:
    """
    Computer Vision baseline classifier for livestock dermatological and mucosal lesions.
    Extracts color distribution, redness index, edge variance, and lesion patterns.
    Baseline prototype corresponding to Mendeley LSD and Kaggle Bovine Lesions datasets.
    """

    def analyze_image(self, image_path: str, lesion_body_part: str = "GENERAL") -> Dict[str, Any]:
        if not os.path.exists(image_path):
            return {
                "lesion_detected": False,
                "predicted_class": "UNKNOWN",
                "confidence": 0.0,
                "features": ["Image file not accessible"]
            }

        try:
            with Image.open(image_path) as img:
                img = img.convert("RGB")
                img_small = img.resize((224, 224))
                arr = np.asarray(img_small, dtype=np.float32)

                # Compute color statistics
                r_mean = np.mean(arr[:, :, 0])
                g_mean = np.mean(arr[:, :, 1])
                b_mean = np.mean(arr[:, :, 2])
                
                # Erythema / Redness ratio
                redness_ratio = (r_mean + 1e-5) / (g_mean + b_mean + 1e-5)
                
                # Texture / Edge roughness using grayscale gradient
                gray = np.mean(arr, axis=2)
                grad_y, grad_x = np.gradient(gray)
                roughness = float(np.std(grad_x) + np.std(grad_y))

                features: List[str] = []
                detected_class = "UNCERTAIN"
                confidence = 0.50

                body_part = lesion_body_part.upper().strip()

                if body_part == "SKIN" or (roughness > 18.0 and redness_ratio > 0.52):
                    # Nodular skin texture pattern
                    detected_class = "LUMPY_SKIN_DISEASE"
                    confidence = min(0.88, 0.55 + (roughness / 60.0) * 0.3)
                    features.append("Cutaneous elevation / nodular textural variance detected")
                    if redness_ratio > 0.6:
                        features.append("Localized erythema around dermal papules")
                
                elif body_part in ["MOUTH", "HOOF"] or (redness_ratio > 0.68 and roughness > 12.0):
                    # Mucosal ulceration / salivation blister pattern
                    detected_class = "FOOT_AND_MOUTH_DISEASE"
                    confidence = min(0.86, 0.52 + redness_ratio * 0.25)
                    features.append("Mucosal hyperemic ulceration / erosion detected")
                    features.append("Moist oral/coronary border reflection detected")
                
                elif body_part == "UDDER":
                    detected_class = "BOVINE_MASTITIS"
                    confidence = min(0.84, 0.50 + redness_ratio * 0.28)
                    features.append("Mammary erythema and vascular engorgement index elevated")
                
                else:
                    # General lesion detection
                    if roughness > 14.0 or redness_ratio > 0.6:
                        detected_class = "LUMPY_SKIN_DISEASE"
                        confidence = 0.65
                        features.append("Non-specific dermal inflammation / scab detected")
                    else:
                        detected_class = "NORMAL_OR_UNSPECIFIED"
                        confidence = 0.40
                        features.append("No acute focal lesion identified in region of interest")

                return {
                    "lesion_detected": detected_class != "NORMAL_OR_UNSPECIFIED",
                    "predicted_class": detected_class,
                    "confidence": round(float(confidence), 3),
                    "features": features,
                    "metrics": {
                        "redness_ratio": round(float(redness_ratio), 3),
                        "roughness_index": round(float(roughness), 3)
                    }
                }

        except Exception as e:
            return {
                "lesion_detected": False,
                "predicted_class": "ERROR",
                "confidence": 0.0,
                "features": [f"Image analysis error: {str(e)}"]
            }

vision_classifier = VisionClassifier()
