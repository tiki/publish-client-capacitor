import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import Utils from "../utils";
import { ReceiptResponse } from "./types";

export default class Capture {
  private publishUrl: string = " https://publish.mytiki.com/latest";

  /**
   * Uses Capacitor to capture a picture with the device's camera or select a photo from the gallery.
   * @returns {string} - the base64 string of the captured/selected image
   */
  public async scan(): Promise<string | undefined> {
    const permissions = await Camera.checkPermissions();

    if (permissions.camera === "denied" || permissions.photos === "denied") {
      await Camera.requestPermissions();
    }

    const photo = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    return photo.base64String
  }

  /**
   * Publishes the photos to Tiki.
   * @param {string[]} images - Array of photos to be published in base64 strings.
   * @param {string} token - the address token to authenticate the request to our server.
   * @returns {Promise<string>} A Promise that resolves with the ID of the request or void in case of any error.
   */
  public async publish(images: string[], token: string): Promise<string | void> {
    const id = window.crypto.randomUUID();

    const headers = new Headers();
    headers.append("Content-Type", "image/jpeg");
    headers.append("Authorization", "Bearer " + token);

    for (const image of images) {
      const body = Utils.base64toBlob(image, "image/jpeg");
      const url = `${this.publishUrl}/receipt/${id}`;

      const response = await fetch(url, {
        method: "PUT",
        body,
        headers,
      });

      if (!response.ok) {
        console.error(`Error uploading files. Status: ${response.status}`);
        return
      }
    }

    return id;
  }

  public async getReceipt(receiptId: string, token: string): Promise<ReceiptResponse[]>{
    const url = `${this.publishUrl}/receipt/${receiptId}`
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);
    const options = {
        method: "GET",
        headers,
      };
    return (await fetch(url, options)).json()
  }
}
