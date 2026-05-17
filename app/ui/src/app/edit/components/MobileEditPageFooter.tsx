import {
  MOBILE_FOOTER_LOGO,
  MOBILE_FOOTER_ROOT,
  MOBILE_FOOTER_TEXT_LINE,
  MOBILE_FOOTER_TEXT_WRAPPER,
} from "../formStyles.v2";

export default function MobileEditPageFooter() {
  return (
    <footer className={MOBILE_FOOTER_ROOT}>
      <span aria-hidden="true" className={MOBILE_FOOTER_LOGO} />
      <div className={MOBILE_FOOTER_TEXT_WRAPPER}>
        <p className={MOBILE_FOOTER_TEXT_LINE}>
          Built with <span role="img" aria-label="love">❤️</span> for Humanity.
        </p>
        <p className={MOBILE_FOOTER_TEXT_LINE}>
          The Benevolent Bandwidth Foundation
        </p>
      </div>
    </footer>
  );
}
