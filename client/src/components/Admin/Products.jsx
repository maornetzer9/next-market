import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadProductsAction, modifyProductsAction } from "../../actions/productActions";
import { useDarkMode } from "../../hooks/darkMode";
import { MdAdd } from "react-icons/md";
import { useProductFilter } from "../../hooks/filterModel";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Product from "./Product";
import AdminEntityImage from "./AdminEntityImage";
import AdminProductFilters from "./AdminProductFilters";
import AdminPageContainer from "./AdminPageContainer";
import AdminPageHeader from "./AdminPageHeader";
import AdminMetricCard from "./AdminMetricCard";
import AdminSectionCard from "./AdminSectionCard";
import ScrollToTop from "../Customer/ScrollToTop";
import _ from "lodash";
import "../../css/admin-products.css";
import { ORIGIN } from "../../App";
import { resolveAdminPurchaseImage } from "../../utils/adminProductImage";

function productIdentity(product) {
  if (!product) return "";
  if (product._id != null) return String(product._id);
  return `${product.title ?? ""}|${product.thumbnail ?? ""}|${product.category ?? ""}`;
}

export default function Products() {
    const PRODUCTS_URL_LOAD = `${ORIGIN}/products/admin`;
  const MODIFY_PRODUCT_URL = `${ORIGIN}/products/modify`;

  const { products = [] } = useSelector((state) => state.productsReducer);

  const dispatch = useDispatch();
  const [darkMode] = useDarkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const hasProductsOnEntryRef = useRef(products.length > 0);
  const productRequestRef = useRef(null);
  const [loading, setLoading] = useState(() => products.length === 0);
  const [error, setError] = useState();

  const {
    categoriesAdmin,
    filteredProducts,
    filteredCategory,
    priceBounds,
    priceRange,
    handlePriceChange,
    handleCategoryChange,
    handleSearchChange,
  } = useProductFilter(products);

  const kpi = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length;
    const lowStock = products.filter((p) => {
      const s = Number(p.stock);
      return Number.isFinite(s) && s > 0 && s <= 5;
    }).length;
    const withPurchases = products.filter(
      (p) => Array.isArray(p.purchases) && p.purchases.length > 0
    ).length;
    return { total, outOfStock, lowStock, withPurchases };
  }, [products]);

  const recentPurchases = useMemo(() => {
    const rows = [];
    products.forEach((product) => {
      (product.purchases || []).forEach((purchase, index) => {
        rows.push({
          key: `${productIdentity(product)}-${index}`,
          productTitle: product.title,
          thumbnail: resolveAdminPurchaseImage(purchase, product),
          quantity: purchase.quantity ?? purchase.qty,
          date: purchase.date || purchase.joinedAt || purchase.createdAt,
          name: purchase.name || purchase.customer,
        });
      });
    });
    return rows.slice(0, 8);
  }, [products]);

  const handleEditClick = useCallback((product) => {
    setEditData(product);
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const modifyProducts = useCallback(
    async (product) => {
      try {
        if (
          _.isEqual(editData, product) &&
          _.isEqual(editData.purchases, product.purchases)
        ) {
          return setIsEditing(false);
        }

        await dispatch(modifyProductsAction(editData, MODIFY_PRODUCT_URL));
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to modify product.", err.message);
        setError(err.message);
      }
    },
    [dispatch, editData, MODIFY_PRODUCT_URL]
  );

  useEffect(() => {
    let active = true;

    if (!productRequestRef.current) {
      if (!hasProductsOnEntryRef.current) setLoading(true);
      try {
        productRequestRef.current = Promise.resolve(dispatch(loadProductsAction(PRODUCTS_URL_LOAD, { authenticated: true })));
      } catch (err) {
        productRequestRef.current = Promise.reject(err);
      }
    }

    productRequestRef.current
      .then((response) => {
        if (!active || response?.code === 200) return;
        setError(response?.message || "Failed to load products.");
      })
      .catch((err) => {
        console.error("Failed To Dispatch Products For Admin");
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, PRODUCTS_URL_LOAD]);

  const handleAddNewProduct = async () => {
    const newProduct = {
      title: "",
      category: "Add Category Name",
      description: "Add Description",
      price: 0,
      thumbnail: "Add Link To Product Image",
      purchases: [],
      bought: 0,
      rating: 0,
      stock: 0,
      total: [],
    };
    await dispatch(modifyProductsAction(newProduct, MODIFY_PRODUCT_URL));
  };

  if (loading) {
    return (
      <AdminPageContainer className="admin-products">
        <div className="admin-products__loading" role="status" aria-live="polite">
          Loading products
        </div>
      </AdminPageContainer>
    );
  }

  return (
      <AdminPageContainer className="admin-products">
        <AdminPageHeader
          title="Products"
          description="Manage your store products. Add, edit or remove products from your shop."
          actions={
            <button
              type="button"
              className="admin-btn-primary"
              onClick={handleAddNewProduct}
            >
              <MdAdd aria-hidden="true" size={20} />
              Add New Product
            </button>
          }
        />

        <div className="admin-page__body">
          <section className="admin-products__summary" aria-label="Product summary">
            <AdminMetricCard tone="coral" icon={Inventory2OutlinedIcon} label="Total products" value={kpi.total} detail="Full catalog" />
            <AdminMetricCard tone="green" icon={CheckCircleOutlineIcon} label="With purchases" value={kpi.withPurchases} detail="Recorded activity" />
            <AdminMetricCard tone="amber" icon={WarningAmberRoundedIcon} label="Low stock" value={kpi.lowStock} detail="Five units or fewer" />
            <AdminMetricCard tone="red" icon={RemoveCircleOutlineRoundedIcon} label="Out of stock" value={kpi.outOfStock} detail="Unavailable now" />
          </section>

          <AdminProductFilters
            categories={categoriesAdmin}
            selectedCategory={filteredCategory}
            onCategoryChange={handleCategoryChange}
            onPriceChange={handlePriceChange}
            onSearch={handleSearchChange}
            priceBounds={priceBounds}
            priceRange={priceRange}
            resultsCount={filteredProducts.length}
          />

          {error ? (
            <p className="admin-products__error" role="alert">
              {error}
            </p>
          ) : null}

          <div
            className="admin-products__list admin-surface"
            data-theme={darkMode ? "dark" : "light"}
          >
            <div className="admin-products__list-viewport">
            <header className="admin-products__list-head">
              <div>
                <span className="admin-products__list-kicker">Catalog</span>
                <strong>Product inventory</strong>
                <small>Live assortment and availability</small>
              </div>
              <div className="admin-products__inventory-count" aria-live="polite">
                <strong>{filteredProducts.length}</strong>
                <span>{filteredProducts.length === 1 ? "product" : "products"}</span>
              </div>
            </header>
            <div className="admin-products__cols" aria-hidden="true">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Source</span>
              <span>Actions</span>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="admin-products__empty">No products match these filters.</p>
            ) : (
              filteredProducts.map((product, index) => {
                const rowEditing =
                  isEditing && productIdentity(editData) === productIdentity(product);

                return (
                  <article
                    key={product._id ?? `${productIdentity(product)}-${index}`}
                    className={`admin-products__row${rowEditing ? " is-editing" : ""}`}
                  >
                    <Product
                      product={product}
                      isEditing={rowEditing}
                      editData={editData}
                      setEditData={setEditData}
                      compact
                    />
                    <div className="admin-products__row-actions">
                      {rowEditing ? (
                        <>
                          <button
                            type="button"
                            className="admin-products__btn admin-products__btn--quiet"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="admin-products__btn admin-products__btn--primary"
                            onClick={() => modifyProducts(product, index)}
                          >
                            Save
                            <SaveAltIcon fontSize="inherit" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="admin-products__btn"
                          onClick={() => handleEditClick(product, index)}
                        >
                          Edit
                          <EditIcon fontSize="inherit" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
            </div>
          </div>

          {recentPurchases.length > 0 ? (
            <AdminSectionCard
              className="admin-products__purchases"
              icon={ShoppingBagOutlinedIcon}
              tone="orange"
              title="Recent product purchases"
              subtitle="Latest recorded customer activity"
              action={<span className="admin-products__purchase-count">{recentPurchases.length} records</span>}
              aria-label="Recent purchases"
            >
              <ul className="admin-products__purchases-list">
                {recentPurchases.map((row) => (
                  <li key={row.key} className="admin-products__purchase">
                    <AdminEntityImage
                      src={row.thumbnail}
                      title={row.productTitle}
                      className="admin-products__purchase-image"
                      width={42}
                      height={42}
                      loading="eager"
                    />
                    <div>
                      <strong>{row.productTitle || "Product"}</strong>
                      <span>{row.name || "Customer"}</span>
                    </div>
                    <span className="admin-products__purchase-qty">Qty {row.quantity ?? "—"}</span>
                    <span className="admin-products__purchase-date">{row.date || "—"}</span>
                  </li>
                ))}
              </ul>
            </AdminSectionCard>
          ) : null}
        </div>

        <ScrollToTop />
      </AdminPageContainer>
  );
}
