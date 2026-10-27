import { handleCustomerRequest } from "./customer-handler.js";

export default {
  fetch(request) {
    return handleCustomerRequest(request);
  },
};
