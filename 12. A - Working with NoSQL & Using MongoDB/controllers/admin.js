const Product = require("../models/product");

// Returns Add/Edit Product form page:
exports.getAddProduct = (req, res, next) => {
  // Path seen from views folder defined in ejs
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

// Adds a product by instanciating it from Product Model
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const imageUrl = req.body.imageUrl;
  const product = new Product(
    title,
    price,
    description,
    imageUrl,
    null,
    req.user._id
  );
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};

// Step 1: Gets product which shall be edited and returns pre-populated Edit Product page:
exports.getEditProduct = (req, res, next) => {
  // Checks for optional data in query parameters:
  // query object is automatically given by express.
  // edit is in this case the key of the key-value pair in query parameter
  const editMode = req.query.edit;

  // Getting the product id
  const prodId = req.params.productId;
  // Receiving product with this id and rendering edit product page if there is a product:

  // Gets the product and renders edit form page if there is one
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        res.redirect("/");
      }
      // Path seen from views folder defined in ejs
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Step 2: Updating a product by click on Update button and saving it to DB:
// First saves updated values from body in post request
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.prodId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const updatedImageUrl = req.body.imageUrl;

  // Creating new product but WITH captured id. Therefore updating product!
  const product = new Product(
    updatedTitle,
    updatedPrice,
    updatedDesc,
    updatedImageUrl,
    prodId
  );
  product // Then saving new instance
    .save()
    .then((result) => {
      console.log("Updated Product!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};

// Shows Admin Products page
exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      // Path seen from views folder defined in ejs
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Deleting a product:
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteById(prodId)
    .then(result => {
      console.log("Deleted Product!");
      res.redirect("/admin/products");
    })
    .catch(err => {
      console.log(err);
    })
};
