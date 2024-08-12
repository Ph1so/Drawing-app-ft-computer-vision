import tensorflow as tf
import numpy as np
from flask import Flask, request, jsonify
# from flask_cors import CORS

app = Flask(__name__)
# CORS(app)

# Load the TensorFlow model
model = tf.keras.models.load_model('digit_model.keras')
model.summary()

@app.route('/', methods=['POST'])
def predict():
    try:
        # Get JSON data from the request
        data = request.json
        if 'image' not in data:
            return jsonify({"error": "No 'image' key in the request"}), 400
        
        # Convert the JavaScript array to a NumPy array
        array = np.array(data['image'])
        
        # Reshape to (1, 28, 28) to match the model's input shape
        if array.shape != (28, 28):
            return jsonify({"error": "Input shape is not (28, 28)"}), 400
        
        array = np.reshape(array, (1, 28, 28))  # Add batch dimension

        # Make prediction
        prediction = model.predict(array)
        predicted_class = np.argmax(prediction)
        # Convert prediction to JSON-compatible format
        prediction_json = predicted_class.tolist()
        return jsonify({"result": prediction_json})

    except Exception as e:
        # Handle any other exceptions
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000)
