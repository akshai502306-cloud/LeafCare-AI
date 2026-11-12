import tensorflow_datasets as tfds

print("Preparing PlantVillage dataset...")

builder = tfds.builder(
    "plant_village",
    data_dir="dataset/tfds"
)

builder.download_and_prepare()

info = builder.info

print("\nDATASET DOWNLOADED SUCCESSFULLY!")
print("Total images:", info.splits["train"].num_examples)
print("Total classes:", info.features["label"].num_classes)
print("Class names:")

for name in info.features["label"].names:
    print("-", name)