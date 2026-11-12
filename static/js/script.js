
const leafInput = document.getElementById("leafInput");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const analyzeButton = document.getElementById("analyzeButton");
const uploadMessage = document.getElementById("uploadMessage");

// Create result area
const resultArea = document.createElement("div");
resultArea.id = "predictionResult";
resultArea.style.marginTop = "20px";
uploadMessage.parentNode.appendChild(resultArea);

// Format disease names
function formatName(name) {
    return name.replace("___", " - ").replaceAll("_", " ");
}

// Image upload and preview
leafInput.addEventListener("change", function () {
    const file = this.files[0];

    resultArea.innerHTML = "";
    analyzeButton.disabled = true;

    if (!file) {
        previewArea.style.display = "none";
        return;
    }

    if (!file.type.startsWith("image/")) {
        uploadMessage.textContent = "Please select a valid image.";
        this.value = "";
        previewArea.style.display = "none";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        uploadMessage.textContent = "Image must be smaller than 10 MB.";
        this.value = "";
        previewArea.style.display = "none";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        previewImage.src = event.target.result;
        previewArea.style.display = "block";
        analyzeButton.disabled = false;
        uploadMessage.textContent = "Image uploaded successfully!";
    };

    reader.readAsDataURL(file);
});

// Analyze leaf using trained AI model
analyzeButton.addEventListener("click", async function () {
    const file = leafInput.files[0];

    if (!file) {
        uploadMessage.textContent = "Please upload a leaf image first.";
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";
    uploadMessage.textContent = "AI is examining your leaf image...";
    resultArea.innerHTML = "";

    try {
        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Prediction failed.");
        }

        const confidence = Number(data.confidence);
        const isHealthy = data.prediction.toLowerCase().includes("healthy");
        const safeConfidence = Math.max(0, Math.min(100, confidence));

        const details = data.details || {
            title: formatName(data.prediction),
            symptoms: "No information available.",
            cause: "No information available.",
            prevention: "Consult an agricultural expert.",
            treatment: "Consult an agricultural expert."
        };

        // Display professional result card
        resultArea.innerHTML = `
            <div style="
                padding: 24px;
                border-radius: 16px;
                background: #edf7ed;
                color: #244b32;
                border: 1px solid #c9dfca;
            ">

                <h3>🌿 LeafCare AI Report</h3>

                <p style="
                    font-weight: bold;
                    color: ${isHealthy ? "#23834b" : "#bd6335"};
                ">
                    ${isHealthy
                        ? "✓ Healthy Leaf Detected"
                        : "⚠ Possible Disease Detected"}
                </p>

                <h2>${formatName(data.prediction)}</h2>

                <p>
                    AI Confidence:
                    <strong>${confidence}%</strong>
                </p>

                <div style="
                    height: 12px;
                    background: #d5e5d5;
                    border-radius: 20px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${safeConfidence}%;
                        height: 100%;
                        background: #368653;
                        border-radius: 20px;
                    "></div>
                </div>

                <h4 style="margin-top: 22px;">
                    📊 Other Predictions
                </h4>

                <div id="topPredictions"></div>

                <hr style="
                    border: 0;
                    border-top: 1px solid #c9dfca;
                    margin: 24px 0;
                ">

                <h3>📋 Disease Information</h3>

                <div style="
                    background: #ffffff;
                    padding: 16px;
                    border-radius: 12px;
                    margin-top: 15px;
                ">
                    <h4>🔍 Symptoms</h4>
                    <p id="symptomsText"></p>

                    <h4>🦠 Cause</h4>
                    <p id="causeText"></p>

                    <h4>🛡️ Prevention</h4>
                    <p id="preventionText"></p>

                    <h4>💊 Treatment Recommendations</h4>
                    <p id="treatmentText"></p>
                </div>

                <p style="
                    font-size: 12px;
                    margin-top: 18px;
                    line-height: 1.6;
                    color: #58705e;
                ">
                    Disclaimer: AI predictions are estimates, not
                    confirmed agricultural diagnoses. Consult an
                    agricultural expert before applying treatments.
                </p>

            </div>
        `;

        // Display top three predictions
        const topContainer = document.getElementById("topPredictions");

        data.top_predictions.forEach(item => {
            const p = document.createElement("p");

            p.textContent =
                `${formatName(item.disease)} — ${item.confidence}%`;

            topContainer.appendChild(p);
        });

        // Display disease details safely
        document.getElementById("symptomsText").textContent = details.symptoms;
        document.getElementById("causeText").textContent = details.cause;
        document.getElementById("preventionText").textContent = details.prevention;
        document.getElementById("treatmentText").textContent = details.treatment;

        uploadMessage.textContent = "Analysis completed successfully!";

    } catch (error) {
        uploadMessage.textContent = error.message;

    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Leaf";
    }
});
