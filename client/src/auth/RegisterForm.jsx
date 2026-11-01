import React, { useId, useState } from "react";
import { useDispatch } from "react-redux";
import { MdLock, MdPerson, MdPersonAdd, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { registerAction } from "../actions/userActions";
import { ORIGIN } from "../App";

export default function RegisterForm({
  onSwitchMode,
  idPrefix = "auth-register",
}) {
  const REGISTER_URL = `${ORIGIN}/user/register`;
  const dispatch = useDispatch();
  const formId = useId();
  const errorId = `${idPrefix}-error`;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    if (localError) setLocalError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { firstName, lastName, username, password } = form;

    if (!firstName || !lastName || !username || !password) {
      setLocalError("Please fill out all the fields.");
      return;
    }

    setIsSubmitting(true);
    setLocalError("");
    setSuccessMessage("");

    try {
      const response = await dispatch(
        registerAction({ firstName, lastName, username, password }, REGISTER_URL)
      );
      if (response.code !== 200) {
        setLocalError(response.message || "Unable to create account.");
        return;
      }

      setSuccessMessage("Account created. Sign in to continue.");
      onSwitchMode?.("sign-in");
    } catch (err) {
      setLocalError(err.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id={formId}
      className="auth-form auth-form--register"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="auth-form__grid">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${idPrefix}-firstName`}>
            First name
          </label>
          <div className="auth-form__control">
            <span className="auth-form__icon" aria-hidden="true">
              <MdPerson />
            </span>
            <input
              id={`${idPrefix}-firstName`}
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${idPrefix}-lastName`}>
            Last name
          </label>
          <div className="auth-form__control">
            <span className="auth-form__icon" aria-hidden="true">
              <MdPerson />
            </span>
            <input
              id={`${idPrefix}-lastName`}
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${idPrefix}-username`}>
          Username
        </label>
        <div className="auth-form__control">
          <span className="auth-form__icon" aria-hidden="true">
            <MdPerson />
          </span>
          <input
            id={`${idPrefix}-username`}
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${idPrefix}-password`}>
          Password
        </label>
        <div className="auth-form__control">
          <span className="auth-form__icon" aria-hidden="true">
            <MdLock />
          </span>
          <input
            id={`${idPrefix}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="auth-form__visibility"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        </div>
      </div>

      {localError ? (
        <p className="auth-form__error" id={errorId} role="alert">
          {localError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="auth-form__success" role="status">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="auth-form__submit"
        disabled={isSubmitting}
        aria-describedby={localError ? errorId : undefined}
      >
        {isSubmitting ? (
          <>
            <span className="auth-form__spinner" aria-hidden="true" />
            <span>Creating account</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <MdPersonAdd aria-hidden="true" />
          </>
        )}
      </button>

      <p className="auth-form__switch">
        Already have an account?{" "}
        <button
          type="button"
          className="auth-form__switch-link"
          onClick={() => onSwitchMode?.("sign-in")}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
