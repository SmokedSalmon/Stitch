# Customized Service
Customized Service is designed to cater features/tools that satisfy:
* **High similarity** on functions/purposes on business perspective, are utilized by most channels
* **Incompatible implementation** on coding level across channels, due to different backend SPEC/API interfaces or other technical details

Under this scenario, **Stitch** provide **Customized Service** for Channels to provide their own implementation of the service.  
Main application of a channel could add it to **Stitch**, **Stitch** then wraps it with **standardized, non-channel SPEC to interface** with any Micro-frontend Application that intends to leverage such feature/tool regardless channels.

---
## Example
Every channel requires `User Profile Service` to manager user information. However a user object may have different fields/properties for the same data point.  
If a MFA want to get User information without handling these SPEC difference, it could get a standardized/bridged version of the service from **Stitch**, which is injected by Main application via Stitch's **Customized Service API**

[A detailed example of `User Profile Service`](./6.3.1.User_Profile_Service)
