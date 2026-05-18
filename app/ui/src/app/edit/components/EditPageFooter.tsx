import { FOOTER_LOGO, FOOTER_ROOT, FOOTER_TEXT } from "../formStyles.v2";

export default function EditPageFooter() {
  return (
    <footer className={FOOTER_ROOT}>
      <span aria-hidden="true" className={FOOTER_LOGO} />
      <p className={FOOTER_TEXT}>
        Built with{" "}
        <span role="img" aria-label="love">
          ❤️
        </span>{" "}
        for Humanity. The Benevolent Bandwidth Foundation
      </p>
    </footer>
  );
}
