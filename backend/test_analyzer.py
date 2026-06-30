import io
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_issue():
    # Create a dummy image
    image = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)

    print("Sending request to /api/issues/analyze ...")
    response = client.post(
        "/api/issues/analyze",
        files={"image": ("test.jpg", img_byte_arr, "image/jpeg")},
        data={"description": "There is a red wall block obstructing the road"}
    )
    
    print("Response Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except Exception as e:
        print("Response Content:", response.text)

if __name__ == "__main__":
    test_analyze_issue()
