require("dotenv").config();
const express = require("express");
const app = express();
const proxy = require("express-http-proxy");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const { validateToken } = require("./middleware/validate.token");
// Add body parser Middleware

const port = process.env.PORT || 3000;

const order_service = process.env.ORDER_SERVICE || "localhost:3005";
const inventory_service = process.env.INVENTORY_SERVICE || "localhost:3004";
const payment_service = process.env.PAYMENT_SERVICE || "localhost:3006";
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  try {
    console.log(`Received ${req.method} request to ${req.url}`);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    next();
  } catch (error) {
    console.error("Middleware error:", error);
    next(error);
  }
});

const proxyOption = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    console.log(err);
    console.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

// for authorization

app.get("/v1/hello", (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "welcome to our API",
  });
  next();
});
// app.use(
//   "/v1/auth",
//   proxy(`http://${auth_service}/api/auth`, {
//     ...proxyOption,
//     proxyReqOptDecorator: (proxyReq, srcReq) => {
//       proxyReq.headers["Content-Type"] = "application/json";
//       return proxyReq;
//     },
//     userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
//       console.log(
//         "Response Recieved from Identity service : ",
//         proxyRes.statuscode
//       );
//       return proxyResData;
//     },
//   })
// );

// Inventory service (no auth by default)
app.use(
  "/v1/inventory",
  proxy(`http://${inventory_service}/api/inventory`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["Content-Type"] = "application/json";
      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from inventory service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

// Order service (requires auth)
app.use(
  "/v1/order",
  (req, res, next) => {
    console.log("called order service");
    next();
  },

  proxy(`http://${order_service}/api`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["Content-Type"] = "application/json";
      if (srcReq.user && srcReq.user.id)
        proxyReq.headers["x-user-id"] = srcReq.user.id;
      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from order service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

// 1. Create the proxy with a fix for the body stream and path rewrite
// const orderProxy = createProxyMiddleware({
//   target: `http://${order_service}`,
//   changeOrigin: true,
//   // FIX 1: Adjust Path Rewrite
//   // app.use('/v1/order') strips the prefix. The proxy sees "/create-order".
//   // We rewrite the starting "/" to "/api/" so it becomes "/api/create-order"

//   onProxyReq: (proxyReq, req, res) => {
//     // FIX 2: Restream the parsed body
//     if (req.body && Object.keys(req.body).length > 0) {
//       const bodyData = JSON.stringify(req.body);

//       // Update headers to match the serialized body
//       proxyReq.setHeader("Content-Type", "application/json");
//       proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

//       // Write the body to the proxy request stream
//       proxyReq.write(bodyData);
//     }
//   },
//   onError: (err, req, res) => {
//     console.error("Proxy error:", err);
//     res.status(500).json({ error: "Proxy failed", details: err.message });
//   },
// });

// 2. Mount the proxy
// app.use("/v1/order", orderProxy);

// Payment service (requires auth)
app.use(
  "/v1/payment",

  proxy(`http://${payment_service}/api/payment`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["Content-Type"] = "application/json";
      if (srcReq.user && srcReq.user.id)
        proxyReq.headers["x-user-id"] = srcReq.user.id;
      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from payment service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
});
