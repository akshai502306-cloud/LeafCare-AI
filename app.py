
from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import json
from PIL import Image
from io import BytesIO
from disease_info import get_disease_info

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Load trained AI model
print("Loading LeafCare AI model...")

model = tf.keras.models.load_model("leafcare_model.keras")

with open("class_names.json", "r") as f:
    class_names = json.load(f)

print("LeafCare AI model loaded successfully!")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    try:
        if "image" not in request.files:
            return jsonify({"error": "Please upload a leaf image."}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "No image selected."}), 400

        # Read and prepare uploaded image
        image = Image.open(BytesIO(file.read())).convert("RGB")
        image = image.resize((128, 128))

        image_array = np.array(image, dtype=np.float32)
        image_array = np.expand_dims(image_array, axis=0)

        # Get AI prediction
        predictions = model.predict(image_array, verbose=0)[0]

        # Find top 3 predictions
        top_indices = np.argsort(predictions)[-3:][::-1]

        top_predictions = []

        for index in top_indices:
            top_predictions.append({
                "disease": class_names[int(index)],
                "confidence": round(float(predictions[index]) * 100, 2)
            })

        # Get best prediction
        best = top_predictions[0]

        # Get disease information
        disease_details = get_disease_info(best["disease"])

        return jsonify({
            "success": True,
            "prediction": best["disease"],
            "confidence": best["confidence"],
            "top_predictions": top_predictions,
            "details": disease_details
        })

    except Exception as e:
        print("Prediction error:", str(e))
        return jsonify({
            "error": "Unable to analyze this image. Please try another image."
        }), 400


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({"error": "Image must be smaller than 10 MB."}), 413


if __name__ == "__main__":
    app.run(debug=True)
