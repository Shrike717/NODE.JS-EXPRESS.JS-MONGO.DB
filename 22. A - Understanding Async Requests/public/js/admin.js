// This code runs in Browser on Client side:
const deleteProduct = (btn) => {
	const prodId = btn.parentNode.querySelector("[name=productId]").value;
	const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;

	fetch("/admin/product/" + prodId, {
		method: "DELETE",
		headers: {
			"csrf-token": csrfToken,
		},
	})
		.then((result) => {
			console.log(result);
		})
		.catch((err) => {
			console.log(err);
		});
};