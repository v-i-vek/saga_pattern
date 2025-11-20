require("dotenv").config();
const express = require("express");
const app = express();
const proxy = require("express-http-proxy");
const cors = require("cors");

const { validateToken } = require("./middleware/validate.token");
// Add body parser Middleware

const port = process.env.PORT || 3000;

const auth_service = process.env.AUTH_SERVICE || "localhost:3001";
const blog_service = process.env.BLOG_SERVICE || "localhost:3002";
const media_service = process.env.MEDIA_SERVICE || "localhost:3003";
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
app.use(
  "/v1/auth",
  proxy(`http://${auth_service}/api/auth`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["Content-Type"] = "application/json";
      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from Identity service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

// for blog_service
app.use(
  "/v1/blog",
  validateToken,
  proxy(`http://${blog_service}/api/blog`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["Content-Type"] = "application/json";
      proxyReq.headers["x-user-id"] = srcReq.user.id;

      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from blog service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

app.use(
  "/v1/media",
  validateToken,
  proxy(`http://${media_service}/api/media`, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReq, srcReq) => {
      proxyReq.headers["x-user-id"] = srcReq.user.id;
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReq.headers["Content-Type"] = "application/json";
      }

      return proxyReq;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log(
        "Response Recieved from media service : ",
        proxyRes.statuscode
      );
      return proxyResData;
    },
  })
);

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
  validateToken,
  proxy(`http://${order_service}/api/order`, {
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

// Payment service (requires auth)
app.use(
  "/v1/payment",
  validateToken,
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
