import Capture from "../Capture";
import Auth from "../Auth";
import License from "../License";
import KeyService from "../Key";
import Utils from "../utils";
import type {
  PostGuardRequest,
  RspGuard,
  PostLicenseRequest,
} from "../License/types/index";
import { Config } from "../Config";
import { ReceiptResponse } from "../Capture/types";
import getInfoResponse from "./types/getInfoResponse";

export default class TikiClient {
  private static instance: TikiClient;

  private userId: string | undefined;
  private config: Config | undefined;
  private keyService = new KeyService();

  private constructor() {}

  public auth: Auth = new Auth(this.keyService);
  public capture = new Capture();
  public license = new License();

  /**
   * Get the singleton instance of TikiClient.
   *
   * @returns TikiClient
   */
  public static getInstance(): TikiClient {
    if (!TikiClient.instance) {
      TikiClient.instance = new TikiClient();
    }
    return TikiClient.instance;
  }

  /**
   * Initialize the TikiClient and register the device's address.
   * @param {string} userId - the ID to be registered to identify the user.
   */
  public static async initialize(userId: string): Promise<void> {
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    const key = await instance.keyService.get(
      instance.config.providerId,
      userId
    );

    if (!key) {
      await instance.auth.registerAddress(
        instance.config.providerId,
        instance.config.publicKey,
        userId
      );
    }

    instance.userId = userId;
  }

  /**
   * Uses the capacitor camera plugin to take a picture
   * @returns {string | void} - The base64 string of the image or void in case of any error.
   */
  public static async scan(): Promise<string | void>{
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    return await instance.capture.scan()
  }
  /**
   * Publish an amount of picture to Tiki Back-end
   * @param {string[]} images - Receives an array of base64 string of the images which need to be published to Tiki
   * @returns {Promise<string | void>} - A promise with the request Id of the upload operation or void in case of any error.
   */
  public static async publish(images: string[]): Promise<string | void> {
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    if (instance.userId == undefined) {
      console.error(
        "User id not defined. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    const { key, addressToken } = await this.getInfo() ?? {}

    if (!key) {
      console.error(
        "Key Pair not found. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    if (!addressToken) {
      console.error("It was not possible to get the token, try to inialize!");
      return;
    }

    if (!addressToken) {
      console.error("Failed to get Address Token");
      return;
    }

    const licenseReq: PostGuardRequest = {
      ptr: instance.userId,
      uses: [
        {
          usecases: [
            {
              value: "attribution",
            },
          ],
          destinations: ["*"],
        },
      ],
    };

    const verifyLicense: RspGuard = await instance.license.guard(
      licenseReq,
      addressToken!
    );

    if (!verifyLicense || !verifyLicense.success) {
      console.error(
        "The License is invalid. Use the TikiClient.license method to issue a new License."
      );
      return;
    }

    await instance.capture.publish(images, addressToken);
  }

  public static async get(receiptId: string): Promise<ReceiptResponse[] | undefined>{
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    if (instance.userId == undefined) {
      console.error(
        "User id not defined. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    const { addressToken } = await this.getInfo() ?? {}

    if (!addressToken) {
      console.error("It was not possible to get the token, try to inialize!");
      return;
    }
    return await this.instance.capture.getReceipt(receiptId, addressToken)
  }

  /**
   * Create a license to publish data to Tiki
   * @returns {Promise<PostLicenseRequest | void>} - The object that contains the license information or void in case of any error.
   */
  public static async createLicense(): Promise<PostLicenseRequest | void> {
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    if (instance.userId == undefined) {
      console.error(
        "User id not defined. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    const { key, addressToken } = await this.getInfo() ?? {}

    if (!key) {
      console.error(
        "Key Pair not found. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    if (!addressToken) {
      console.error("It was not possible to get the token, try to initialize!");
      return;
    }

    const terms: string = instance.license.terms(
      instance.config.companyName,
      instance.config.companyJurisdiction,
      instance.config.tosUrl,
      instance.config.privacyUrl
    )

    let licenseReq: PostLicenseRequest = {
      ptr: instance.userId,
      tags: ["purchase_history"],
      uses: [
        {
          usecases: [
            {
              value: "attribution",
            },
          ],
          destinations: ["*"],
        },
      ],
      licenseDesc: "",
      expiry: undefined,
      titleDesc: undefined,
      terms: terms
    };


    const licenseSignature = await Utils.signMessage(
      JSON.stringify(licenseReq),
      key.value.privateKey
    );

    licenseReq.userSignature = licenseSignature

    return await instance.license.create(addressToken, licenseReq);
  }

  /**
   * Configure the class instance with the company information, necessary to others operations
   * @param {Config} configuration - The Object that contains the company information to be instantiated.
   */
  public static configuration(configuration: Config) {
    let instance = TikiClient.getInstance();
    instance.config = configuration;
  }

  private static async getInfo(): Promise<getInfoResponse | undefined>{
    let instance = TikiClient.getInstance();

    if (instance.config == undefined) {
      console.error(
        "TIKI Client is not configured. Use the TikiClient.configure method to add a configuration."
      );
      return;
    }

    if (instance.userId == undefined) {
      console.error(
        "User id not defined. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    const key = await instance.keyService.get(
      instance.config.providerId,
      instance.userId
    );

    if (!key) {
      console.error(
        "Key Pair not found. Use the TikiClient.initialize method to register the user."
      );
      return;
    }

    const address: string = Utils.arrayBufferToBase64Url(
      await instance.keyService.address(key.value)
    );

    const signature: string = await Utils.generateSignature(
      address,
      key?.value.privateKey
    );

    const addressToken: string | undefined = await instance.auth.getToken(
      instance.config.providerId,
      signature,
      [],
      address
    );

    if (!addressToken) {
      console.error("Failed to get Address Token");
      return;
    }

    return {key, addressToken}
  } 
}
