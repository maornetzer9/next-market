import React, { memo } from "react";
import { Link } from "react-router-dom";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AdminEntityImage from "./AdminEntityImage";
import { getCategoryTone } from "../../utils/categoryTone";
import { resolveAdminProductImage } from "../../utils/adminProductImage";
import "../../css/admin-product.css";

function stockLabel(stock) {
  const value = Number(stock);
  if (!Number.isFinite(value)) return { text: "—", tone: "muted" };
  if (value <= 0) return { text: "Out of Stock", tone: "danger" };
  if (value <= 5) return { text: "Low Stock", tone: "warn" };
  return { text: "In Stock", tone: "ok" };
}

function sourceLabel(source) {
  if (!source) return "—";
  try {
    return new URL(source).hostname.replace(/^www\./, "");
  } catch {
    return String(source).replace(/^https?:\/\//, "").split("/")[0] || "Image source";
  }
}

function ProductStock({ stock, compact = false }) {
  const status = stockLabel(stock);
  const numericStock = Number(stock);
  return (
    <span className={`admin-product__stock is-${status.tone}${compact ? " is-compact" : ""}`}>
      <span className="admin-product__stock-state">
        <span className="admin-product__stock-dot" aria-hidden="true" />
        {status.text}
      </span>
      {Number.isFinite(numericStock) ? (
        <span className="admin-product__stock-units">{numericStock} {numericStock === 1 ? "unit" : "units"}</span>
      ) : null}
    </span>
  );
}

function Product({
  product = {},
  isEditing = false,
  editData = {},
  setEditData = () => {},
  compact = false,
}) {
  const handleChange = ({ target: { name, value } }) => {
    setEditData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const display = isEditing ? editData : product;
  const thumbSrc = resolveAdminProductImage(display, product);
  const title = product.title || "Untitled product";
  const categoryTone = getCategoryTone(product.category);

  if (isEditing) {
    return (
      <div className="admin-product is-editing">
        <div className="admin-product__editor">
          <div className="admin-product__editor-media">
            <AdminEntityImage
              src={thumbSrc}
              title={editData.title || title}
              className="admin-product__thumb"
              width={88}
              height={88}
            />
            <div>
              <span className="admin-product__editor-kicker">Editing product</span>
              <strong>{title}</strong>
              <span>{product._id ? `ID · ${String(product._id).slice(-6)}` : "New catalog item"}</span>
              <span className="admin-product__editor-stock-label">Current stock</span>
              <ProductStock stock={product.stock} compact />
            </div>
          </div>

          <div className="admin-product__editor-form">
            <label className="admin-product__edit-field admin-product__edit-field--title">
              <span>Title</span>
              <input
                className="admin-product__input"
                name="title"
                value={editData.title ?? ""}
                onChange={handleChange}
                aria-label="Title"
              />
            </label>

            <label className="admin-product__edit-field admin-product__edit-field--category">
              <span>Category</span>
              <input
                className="admin-product__input"
                name="category"
                value={editData.category ?? ""}
                onChange={handleChange}
                aria-label="Category"
              />
            </label>

            <label className="admin-product__edit-field admin-product__edit-field--price">
              <span>Price</span>
              <input
                className="admin-product__input admin-product__input--price"
                name="price"
                value={editData.price ?? ""}
                onChange={handleChange}
                aria-label="Price"
                inputMode="decimal"
              />
            </label>

            <label className="admin-product__edit-field admin-product__edit-field--description">
              <span>Description</span>
              <textarea
                className="admin-product__textarea"
                name="description"
                value={editData.description ?? ""}
                onChange={handleChange}
                rows={3}
                aria-label="Description"
              />
            </label>

            <label className="admin-product__edit-field admin-product__edit-field--thumbnail">
              <span>Image URL</span>
              <input
                className="admin-product__input"
                name="thumbnail"
                value={editData.thumbnail ?? ""}
                onChange={handleChange}
                aria-label="Thumbnail URL"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-product${compact ? " is-compact" : ""}`}>
      <div className="admin-product__grid">
        <AdminEntityImage
          src={thumbSrc}
          title={title}
          className="admin-product__thumb"
          width={64}
          height={64}
        />

        <div className="admin-product__identity">
          <h2 className="admin-product__title">{title}</h2>
          {compact ? (
            <span className="admin-product__meta">
              {product._id ? `ID · ${String(product._id).slice(-6)}` : "Catalog item"}
            </span>
          ) : null}
        </div>

        <div className="admin-product__field admin-product__field--category">
          <span className="admin-product__label">Category</span>
          <span
            className="admin-product__badge"
            style={{ "--category-tint": categoryTone.bg, "--category-accent": categoryTone.fg }}
          >
            {product.category}
          </span>
        </div>

        <div className="admin-product__field admin-product__field--description">
          <span className="admin-product__label">Description</span>
          <p className="admin-product__text">{product.description}</p>
        </div>

        <div className="admin-product__field admin-product__field--price">
          <span className="admin-product__label">Price</span>
          <span className="admin-product__price">${product.price}</span>
        </div>

        <div className="admin-product__field admin-product__field--stock">
          <span className="admin-product__label">Stock</span>
          <ProductStock stock={product.stock} />
        </div>

        <div className="admin-product__field admin-product__field--url">
          <span className="admin-product__label">Image source</span>
          {product.thumbnail ? (
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className="admin-product__link"
              to={product.thumbnail}
              title={product.thumbnail}
            >
              <OpenInNewRoundedIcon aria-hidden="true" />
              <span>{sourceLabel(product.thumbnail)}</span>
            </Link>
          ) : (
            <span className="admin-product__muted">—</span>
          )}
        </div>
      </div>

    </div>
  );
}

export default memo(Product);
