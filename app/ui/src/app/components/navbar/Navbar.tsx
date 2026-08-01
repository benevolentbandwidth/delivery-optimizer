"use client";

import {
  NAVBAR_V2_BTN_SAVE,
  NAVBAR_V2_LOGO,
  NAVBAR_V2_ROOT,
} from "@/app/edit/formStyles.v2";

type NavbarProps = {
  onSave: () => void;
};

export default function Navbar({ onSave }: NavbarProps) {
  return (
    <header className={NAVBAR_V2_ROOT}>
      <span className={NAVBAR_V2_LOGO}>Delivery Optimizer</span>
      <button className={NAVBAR_V2_BTN_SAVE} onClick={onSave} type="button">
        Save
      </button>
    </header>
  );
}
