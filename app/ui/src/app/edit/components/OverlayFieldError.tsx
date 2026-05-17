import {
  OVERLAY_FIELD_ERROR_CONTAINER,
  OVERLAY_FIELD_ERROR_ICON,
  OVERLAY_FIELD_ERROR_TEXT,
} from "../formStyles.v2";

const WARNING_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill="#DA1B0B"
    />
    <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="white" />
  </svg>
);

type OverlayFieldErrorProps = {
  message: string;
};

export default function OverlayFieldError({ message }: OverlayFieldErrorProps) {
  return (
    <div role="alert" className={OVERLAY_FIELD_ERROR_CONTAINER}>
      <span className={OVERLAY_FIELD_ERROR_ICON}>{WARNING_ICON}</span>
      <p className={OVERLAY_FIELD_ERROR_TEXT}>{message}</p>
    </div>
  );
}
