import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from ml.ovr_predictor import predict_ovr

print("--- Testing ST Profile ---")
st_stats = {
    "pace": 82,
    "shooting": 85,
    "passing": 45,
    "dribbling": 70,
    "defending": 20,
    "physical": 75
}
st_ovr = predict_ovr("ST", **st_stats)
print(f"ST OVR: {st_ovr}")
print("ST OK")

print("\n--- Testing GK Profile ---")
gk_stats = {
    "pace": 45,
    "shooting": 15,
    "passing": 50,
    "dribbling": 50,
    "defending": 50,
    "physical": 50,
    "gk_diving": 80,
    "gk_handling": 78,
    "gk_kicking": 65,
    "gk_reflexes": 82,
    "gk_positioning": 75
}
gk_ovr = predict_ovr("GK", **gk_stats)
print(f"GK OVR: {gk_ovr}")
print("GK OK")


print("\n--- Testing CAM Profile ---")
cam_stats = {
    "pace": 68,
    "shooting": 65,
    "passing": 80,
    "dribbling": 82,
    "defending": 30,
    "physical": 50
}
cam_ovr = predict_ovr("CAM", **cam_stats)
print(f"CAM OVR: {cam_ovr}")
print("CAM OK")

print("\nAll tests passed successfully!")
