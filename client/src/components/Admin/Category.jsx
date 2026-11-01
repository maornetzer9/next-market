import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from 'framer-motion';
import { useDispatch } from 'react-redux'
import { deleteCategoriesAction, updateCategoriesAction } from "../../actions/productActions";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import CloseIcon from '@mui/icons-material/Close';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HikingOutlinedIcon from '@mui/icons-material/HikingOutlined';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import SportsBasketballOutlinedIcon from '@mui/icons-material/SportsBasketballOutlined';
import TabletMacOutlinedIcon from '@mui/icons-material/TabletMacOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { ORIGIN } from "../../App";
import { getCategoryTone } from "../../utils/categoryTone";
import '../../css/admin-categories.css';

function iconFor(category) {
  const value = String(category || '').toLowerCase();
  if (value.includes('fragrance')) return WaterDropOutlinedIcon;
  if (value.includes('beauty') || value.includes('skin-care')) return SpaOutlinedIcon;
  if (value.includes('furniture')) return ChairOutlinedIcon;
  if (value.includes('grocer')) return ShoppingBasketOutlinedIcon;
  if (value.includes('home-decoration')) return HomeOutlinedIcon;
  if (value.includes('kitchen')) return KitchenOutlinedIcon;
  if (value.includes('laptop')) return LaptopMacOutlinedIcon;
  if (value.includes('mobile') || value.includes('smartphone')) return SmartphoneOutlinedIcon;
  if (value.includes('tablet')) return TabletMacOutlinedIcon;
  if (value.includes('watch')) return WatchOutlinedIcon;
  if (value.includes('motorcycle')) return TwoWheelerOutlinedIcon;
  if (value.includes('sport')) return SportsBasketballOutlinedIcon;
  if (value.includes('sunglass')) return VisibilityOutlinedIcon;
  if (value.includes('vehicle')) return DirectionsCarOutlinedIcon;
  if (value.includes('jewell')) return DiamondOutlinedIcon;
  if (value.includes('bag')) return WorkOutlineOutlinedIcon;
  if (value.includes('shoe')) return HikingOutlinedIcon;
  if (value.includes('shirt') || value.includes('dress') || value.includes('top')) return CheckroomOutlinedIcon;
  return CategoryOutlinedIcon;
}

export default function Category({ category, label = category, productCount = 0 }) {
  const UPDATE_CATEGORIES_URL = `${ORIGIN}/products/update`;
  const DELETE_CATEGORIES_URL = `${ORIGIN}/products/delete`;

  const dispatch = useDispatch();

  const [editPhase, setEditPhase] = useState('idle');
  const [newCategory, setNewCategory] = useState(category);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const reduceMotion = useReducedMotion();
  const mobileMenuRef = useRef(null);
  const tone = getCategoryTone(category);
  const CategoryIcon = iconFor(category);
  const editLayout = editPhase !== 'idle';
  const edit = editPhase === 'editing';
  const normal = editPhase === 'idle';

  useEffect(() => {
    if (editPhase !== 'exiting') return undefined;
    const timeout = window.setTimeout(() => setEditPhase('idle'), reduceMotion ? 0 : 220);
    return () => window.clearTimeout(timeout);
  }, [editPhase, reduceMotion]);

  const closeMobileMenu = () => mobileMenuRef.current?.removeAttribute('open');
  const startEditing = () => {
    setNewCategory(category);
    setFeedback('');
    setEditPhase('editing');
    closeMobileMenu();
  };
  const cancelEditing = () => {
    setNewCategory(category);
    setFeedback('');
    setEditPhase('exiting');
    closeMobileMenu();
  };
  const handleOnChange = ({ target: { value } }) => {
    setNewCategory(value);
    setFeedback('');
  };

  const handleDeleteCategories = async (cat) => {
    const confirmed = window.confirm(
      `Delete “${label}” and all ${productCount} ${productCount === 1 ? 'product' : 'products'} in it? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setFeedback('');
    closeMobileMenu();
    try {
      const response = await dispatch(deleteCategoriesAction(cat, DELETE_CATEGORIES_URL));
      if (response?.code !== 200) {
        setFeedback(response?.message || 'This category could not be deleted.');
      }
    } catch (error) {
      setFeedback('This category could not be deleted.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateCategories = async (cat) => {
    const nextCategory = newCategory.trim();
    if (!nextCategory) {
      setFeedback('Enter a category name before saving.');
      return;
    }
    if (nextCategory === cat) {
      cancelEditing();
      return;
    }

    setBusy(true);
    setFeedback('');
    try {
      const categories = { old: cat, new: nextCategory };
      const response = await dispatch(updateCategoriesAction(categories, UPDATE_CATEGORIES_URL));
      if (response?.code !== 200) {
        setFeedback(response?.message || 'This category could not be renamed.');
        return;
      }
      setEditPhase('exiting');
    } catch (error) {
      setFeedback('This category could not be renamed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-categories__identity">
        <span
          className="admin-categories__mark"
          style={{ '--category-tint': tone.bg, '--category-accent': tone.fg }}
          aria-hidden="true"
        >
          <CategoryIcon aria-hidden="true" />
        </span>
        <div className="admin-categories__identity-copy">
          <motion.div
            className="admin-categories__identity-normal"
            initial={false}
            animate={edit ? { opacity: 0, scale: 0.99 } : { opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : edit ? 0.08 : 0.14, delay: reduceMotion || edit ? 0 : 0.06, ease: [0.2, 0.7, 0.2, 1] }}
            aria-hidden={edit}
          >
            <p className="admin-categories__name" title={label}>{label}</p>
            <p className="admin-categories__desc" title={category}>{category}</p>
          </motion.div>
          {editLayout ? (
            <motion.input
              className="admin-categories__edit-field"
              initial={false}
              animate={edit ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : edit ? 0.12 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              onChange={handleOnChange}
              value={newCategory}
              name={category}
              aria-label={`Edit category ${label}`}
              aria-hidden={!edit}
              tabIndex={edit ? 0 : -1}
              readOnly={!edit}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleUpdateCategories(category);
                if (event.key === 'Escape') cancelEditing();
              }}
            />
          ) : null}
          {feedback ? <p className="admin-categories__feedback" role="alert">{feedback}</p> : null}
        </div>
      </div>

      <div className="admin-categories__count" title="Products in category">
        <span className="admin-categories__count-label">products</span>
        <strong>{productCount}</strong>
      </div>

      <div className="admin-categories__action-slot">
        <motion.div
          className="admin-categories__action-layer admin-categories__action-layer--normal"
          initial={false}
          animate={normal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduceMotion ? 0 : normal ? 0.14 : 0.08, delay: reduceMotion || !normal ? 0 : 0.02, ease: [0.2, 0.7, 0.2, 1] }}
          aria-hidden={!normal}
        >
          <details ref={mobileMenuRef} className="admin-categories__mobile-menu">
            <summary aria-label={`Actions for ${label}`} tabIndex={normal ? 0 : -1}>
              <MoreHorizIcon aria-hidden="true" />
            </summary>
            <div className="admin-categories__mobile-menu-popover">
              <button type="button" onClick={startEditing} disabled={busy} tabIndex={normal ? 0 : -1}>Edit</button>
              <button type="button" className="admin-categories__mobile-danger" onClick={() => handleDeleteCategories(category)} disabled={busy} tabIndex={normal ? 0 : -1}>Delete</button>
            </div>
          </details>
        </motion.div>

        <motion.div
          className="admin-categories__action-layer admin-categories__action-layer--edit"
          initial={false}
          animate={edit ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduceMotion ? 0 : edit ? 0.12 : 0.13, delay: reduceMotion || !edit ? 0 : 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          aria-hidden={!edit}
        >
          <div className="admin-categories__actions admin-categories__actions--desktop">
            <button type="button" className="admin-categories__btn admin-categories__btn--save" onClick={() => handleUpdateCategories(category)} disabled={busy} aria-label="Save" title="Save" tabIndex={edit ? 0 : -1}>
              <SaveAltIcon fontSize="inherit" aria-hidden="true" />
              <span className="admin-categories__btn-label">Save</span>
            </button>
            <button type="button" className="admin-categories__btn admin-categories__btn--cancel" onClick={cancelEditing} disabled={busy} aria-label="Cancel" title="Cancel" tabIndex={edit ? 0 : -1}>
              <CloseIcon fontSize="inherit" aria-hidden="true" />
              <span className="admin-categories__btn-label">Cancel</span>
            </button>
            <button type="button" className="admin-categories__btn admin-categories__btn--danger" onClick={() => handleDeleteCategories(category)} disabled={busy} aria-label={`Delete ${label}`} title="Delete" tabIndex={edit ? 0 : -1}>
              <DeleteOutlineIcon fontSize="inherit" aria-hidden="true" />
              <span className="admin-categories__btn-label">Delete</span>
            </button>
          </div>
          <div className="admin-categories__mobile-edit-actions" aria-label={`Edit actions for ${label}`}>
            <button type="button" onClick={() => handleUpdateCategories(category)} disabled={busy} tabIndex={edit ? 0 : -1}>Save</button>
            <button type="button" onClick={cancelEditing} disabled={busy} tabIndex={edit ? 0 : -1}>Cancel</button>
            <button type="button" className="admin-categories__mobile-danger" onClick={() => handleDeleteCategories(category)} disabled={busy} tabIndex={edit ? 0 : -1}>Delete</button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
