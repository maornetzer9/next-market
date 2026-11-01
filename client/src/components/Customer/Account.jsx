import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MdAlternateEmail,
  MdCheck,
  MdClose,
  MdEdit,
  MdErrorOutline,
  MdLockOutline,
  MdOutlineAccountCircle,
  MdOutlineBadge,
  MdPersonOutline,
  MdSave,
  MdShare,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";

import { customerUpdateAction } from "../../actions/userActions";
import { ORIGIN } from "../../App";
import { ReadyPageContent } from "../../UI/PageContentEntrance";
import PageHeader from "./PageHeader";
import "../../css/account.css";

const ACCOUNT_EASE = [0.16, 1, 0.3, 1];

const editableUser = (user) => ({
  _id: user?._id ?? "",
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  username: user?.username ?? "",
  password: "",
  checked: Boolean(user?.checked),
});

function AccountField({
  edit,
  icon: Icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  autoComplete,
  disabled,
}) {
  return (
    <div className={`account-field${edit ? " is-editing" : ""}`}>
      {Icon ? (
        <span className="account-field__icon" aria-hidden="true">
          <Icon />
        </span>
      ) : null}
      <div className="account-field__body">
        <label htmlFor={`account-${name}`}>{label}</label>
        <div className="account-field__control">
          <p className="account-field__value">{value || "—"}</p>
          <input
            id={`account-${name}`}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required={type !== "password"}
            disabled={disabled || !edit}
            tabIndex={edit ? 0 : -1}
            aria-hidden={!edit}
            spellCheck={name === "username" ? false : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const user = useSelector((state) => state.userReducer.user);
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(() => editableUser(user));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const displayName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    [user?.firstName, user?.lastName],
  );
  const initials = useMemo(
    () =>
      [user?.firstName, user?.lastName]
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user?.firstName, user?.lastName],
  );

  useEffect(() => {
    setForm(editableUser(user));
  }, [user]);

  const startEditing = () => {
    setFeedback(null);
    setEdit(true);
  };

  const cancelEditing = () => {
    setForm(editableUser(user));
    setFeedback(null);
    setEdit(false);
  };

  const handleFormChange = ({ target }) => {
    const { name, type, value, checked } = target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { firstName, lastName, username } = form;

    if (!firstName || !lastName || !username) {
      setFeedback({ type: "error", message: "First name, last name, and username are required." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await dispatch(
        customerUpdateAction(form, `${ORIGIN}/user/update`),
      );

      if (!response || response.code !== 200) {
        setFeedback({
          type: "error",
          message: response?.message || "Account details could not be updated.",
        });
        return;
      }

      setEdit(false);
      setFeedback({ type: "success", message: response.message });
    } catch (error) {
      console.error("Failed To Update User Form", error.message);
      setFeedback({ type: "error", message: "Account details could not be updated." });
    } finally {
      setSubmitting(false);
    }
  };

  const profileReady = Boolean(user?._id);

  if (!profileReady) {
    return null;
  }

  return (
    <ReadyPageContent ready={profileReady}>
      <section className={`account-page${edit ? " is-editing" : ""}`} aria-labelledby="account-title">
        <PageHeader
          className="account-heading"
          icon={MdOutlineAccountCircle}
          title="Account"
          titleId="account-title"
          description="Manage your profile, account preferences and order sharing settings."
          meta={
            <p className="account-heading__mode b25-tabular">{edit ? "Editing" : "Profile"}</p>
          }
        />

        <section
          className="account-identity"
          aria-labelledby="account-identity-title"
        >
        <div className="account-identity__mark" aria-hidden="true">
          {initials || <MdPersonOutline />}
        </div>
        <div className="account-identity__copy">
          <p className="b25-ui-label">Customer identity</p>
          <h2 id="account-identity-title">{displayName || user?.username}</h2>
          <div className="account-identity__metadata">
            {user?.username ? <span className="b25-tabular">@{user.username}</span> : null}
            {user?.role ? <span className="account-identity__role">{user.role}</span> : null}
          </div>
        </div>
        <button
          type="button"
          className={`account-edit-action${edit ? " is-active" : ""}`}
          onClick={edit ? undefined : startEditing}
          aria-pressed={edit}
        >
          <MdEdit aria-hidden="true" />
          {edit ? "Editing" : "Edit account"}
        </button>
        </section>

      <form className="account-form" onSubmit={handleSubmit} noValidate>
        <section
          className="account-surface account-profile"
          aria-labelledby="account-profile-title"
        >
          <header className="account-section-heading">
            <div>
              <p className="b25-ui-label">Profile</p>
              <h2 id="account-profile-title">Account details</h2>
            </div>
            <span className="account-section-heading__meta">
              {edit ? "Update your information" : "Personal information"}
            </span>
          </header>

          <div className="account-fields">
            <AccountField
              edit={edit}
              icon={MdPersonOutline}
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={handleFormChange}
              autoComplete="given-name"
              disabled={submitting}
            />
            <AccountField
              edit={edit}
              icon={MdOutlineBadge}
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={handleFormChange}
              autoComplete="family-name"
              disabled={submitting}
            />
            <AccountField
              edit={edit}
              icon={MdAlternateEmail}
              label="Username"
              name="username"
              value={form.username}
              onChange={handleFormChange}
              autoComplete="username"
              disabled={submitting}
            />
          </div>
        </section>

        <div className="account-supporting">
          <section className="account-surface account-access" aria-labelledby="account-access-title">
            <header className="account-section-heading">
              <div>
                <p className="b25-ui-label">Access</p>
                <h2 id="account-access-title">Order sharing</h2>
              </div>
              <MdShare aria-hidden="true" />
            </header>
            <div className="account-panel-body">
              <p id="account-sharing-help" className="account-section-copy">
                Allow other signed-in customers to view your historical order records.
              </p>
              <label className="account-sharing-control">
                <span>
                  <strong>{form.checked ? "Sharing enabled" : "Sharing disabled"}</strong>
                  <small>
                    {edit
                      ? "This opts your order history into the shared Orders view."
                      : "Enter edit mode to change access"}
                  </small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  name="checked"
                  checked={form.checked}
                  onChange={handleFormChange}
                  disabled={!edit || submitting}
                  aria-checked={form.checked}
                  aria-describedby="account-sharing-help"
                />
                <span className="account-sharing-control__track" aria-hidden="true">
                  <span />
                </span>
              </label>
            </div>
          </section>

          <section className="account-surface account-security" aria-labelledby="account-security-title">
            <header className="account-section-heading">
              <div>
                <p className="b25-ui-label">Security</p>
                <h2 id="account-security-title">Password</h2>
              </div>
              <MdLockOutline aria-hidden="true" />
            </header>
            <div className={`account-panel-body account-password-panel${edit ? " is-editing" : ""}`}>
              <p className="account-section-copy" aria-hidden={edit}>
                Your password remains private and is never displayed.
              </p>
              <div
                className="account-field account-password-field"
                aria-hidden={!edit}
                {...(!edit ? { inert: "" } : {})}
              >
                <label htmlFor="account-password">New password</label>
                <input
                  id="account-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  autoComplete="new-password"
                  disabled={submitting || !edit}
                  tabIndex={edit ? 0 : -1}
                  aria-hidden={!edit}
                  placeholder="Leave blank to keep current password"
                  aria-describedby="account-password-help"
                />
                <small id="account-password-help">
                  Leave blank to keep your current password. The current password is never displayed.
                </small>
              </div>
            </div>
          </section>
        </div>

        <div className="account-toolbar">
          <AnimatePresence initial={false}>
            {feedback ? (
              <motion.div
                key={`${feedback.type}-${feedback.message}`}
                className={`account-feedback is-${feedback.type}`}
                role={feedback.type === "error" ? "alert" : "status"}
                aria-live="polite"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: reduceMotion ? 0.08 : 0.28, ease: ACCOUNT_EASE }}
              >
                {feedback.type === "error" ? (
                  <MdErrorOutline aria-hidden="true" />
                ) : (
                  <MdCheck aria-hidden="true" />
                )}
                <span>{feedback.message}</span>
              </motion.div>
            ) : (
              <span className="account-toolbar__spacer" aria-hidden="true" />
            )}
          </AnimatePresence>

          <div className={`account-actions${edit ? " is-visible" : ""}`}>
            <button
              type="button"
              className="account-action account-action--secondary"
              onClick={cancelEditing}
              disabled={!edit || submitting}
              tabIndex={edit ? 0 : -1}
              aria-hidden={!edit}
            >
              <MdClose aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              className="account-action account-action--primary"
              disabled={!edit || submitting}
              tabIndex={edit ? 0 : -1}
              aria-hidden={!edit}
            >
              <MdSave aria-hidden="true" />
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
      </section>
    </ReadyPageContent>
  );
}
