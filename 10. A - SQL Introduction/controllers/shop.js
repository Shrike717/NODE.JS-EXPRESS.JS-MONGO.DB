const Product = require("../models/product");
const Cart = require("../models/cart");

// Calls fetchAll in model, gets the products an returns Product List Page in Index:
exports.getIndex = (req, res, next) => {
  Product.fetchAll()
  .then(([rows, fieldData]) => {
    // Path seen from views folder defined in ejs
    res.render("shop/index", {
      prods: rows,
      pageTitle: "Shop",
      path: "/",
    });
  })
  .catch(err => {
    console.log(err);
  });
};

// Calls fetchAll in model, gets the products an returns Product List Page in Shop:
exports.getProducts = (req, res, next) => {
  Product.fetchAll()
  .then(([rows, fieldData]) => {
    // Path seen from views folder defined in ejs
    res.render("shop/product-list", {
      prods: rows,
      pageTitle: "All Products",
      path: "/products",
    });
  })
  .catch(err => {
    console.log(err);
  });
};


// Gets one product by its id through the URL and renders detail page:
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Sends wanted product id to Model and gets back wanted product in nested array.
  // Then sends product data as first element from array to view and renders product details
  Product.findById(prodId)
    .then(([product]) => {
      res.render("shop/product-detail", {
        product: product[0],
        pageTitle: product.title,
        path: "/products",
      })
    })
    .catch(err => {console.log(err)});
};

// Gets product by its Id through the body from post request and adds product to cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  // First  gets product by Id in Product model
  // Then adding product to cart in cart model
  Product.findById(prodId, (product) => {
    Cart.addProduct(prodId, product.price);
  });
  res.redirect("/cart");
};

// Gets all products in cart and renders cart page
exports.getCart = (req, res, next) => {
  // Gets cart from Cart model
  Cart.getCart((cart) => {
    // Gets all products from Product model
    Product.fetchAll((products) => {
      // Filtering the full products which are in the cart
      const cartProducts = [];
      for (product of products) {
        // Extracting cart products to get the quantity value later on
        const cardProductData = cart.products.find(
          (prod) => prod.id === product.id
        );
        if (cardProductData) {
          // Combining a new product object with all info AND quantity by destructuring
          cartProducts.push({ productData: product, qty: cardProductData.qty });
        }
      }
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: cartProducts,
      });
    });
  });
};

// Deletes product in cart
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // First  gets product by Id in Product model
  // Then deleting product in cart in Cart model
  Product.findById(prodId, (product) => {
    Cart.deleteProduct(prodId, product.price);
  });
  res.redirect("/cart");
};

exports.getOrders = (req, res, next) => {
  res.render("shop/orders", {
    pageTitle: "Your Orders",
    path: "/orders",
  });
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/checkout", {
    pageTitle: "Checkout",
    path: "/checkout",
  });
};
