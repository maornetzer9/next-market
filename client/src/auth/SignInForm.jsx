import React, { useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdLogin, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { loginAction } from "../actions/userActions";
import { ORIGIN } from "../App";
import { resolveLoginRedirect } from "./authRedirect";

export default function SignInForm({
  returnLocation = null,
  onSuccess,
  onSwitchMode,
  idPrefix = "auth-sign-in",
}) {
  const LOGIN_URL = `${ORIGIN}/user/login`;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formId = useId();
  const errorId = `${idPrefix}-error`;
  const serverError = useSelector((state) => state.userReducer.error);

  const [form, setForm] = useState({ username: "", password: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (localError) setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = form;

    if (!username || !password) {
      setLocalError("Enter username and password.");
      return;
    }

    setIsSubmitting(true);
    setLocalError("");

    try {
      const result = await dispatch(loginAction(username, password, LOGIN_URL));
      if (result.code !== 200 || !result.role) {
        setLocalError(result.message || serverError || "Unable to sign in.");
        return;
      }

      const destination = resolveLoginRedirect(result.role, returnLocation);
      onSuccess?.();
      navigate(destination, { replace: true });
    } catch (err) {
      setLocalError(err.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || serverError;

  return (
    <form
      id={formId}
      className="auth-form"
      onSubmit={handleSubmit}
      noValidate
    >
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
            autoComplete="current-password"
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

      {displayError ? (
        <p className="auth-form__error" id={errorId} role="alert">
          {displayError}
        </p>
      ) : null}

      <button
        type="submit"
        className="auth-form__submit"
        disabled={isSubmitting}
        aria-describedby={displayError ? errorId : undefined}
      >
        {isSubmitting ? (
          <>
            <span className="auth-form__spinner" aria-hidden="true" />
            <span>Signing in</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <MdLogin aria-hidden="true" />
          </>
        )}
      </button>

      <p className="auth-form__switch">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="auth-form__switch-link"
          onClick={() => onSwitchMode?.("register")}
        >
          Create account
        </button>
      </p>
    </form>
  );
}
