import {
  ADDRESS_ROW_HEADER_ROOT,
  ADDRESS_ROW_HEADER_COLS,
  ADDRESS_ROW_HEADER_CELL_RECIPIENT,
  ADDRESS_ROW_HEADER_CELL_QUANTITY,
  ADDRESS_ROW_HEADER_CELL_DELIVERY_EST,
  ADDRESS_ROW_HEADER_CELL_DELIVERY_TIME,
  ADDRESS_ROW_HEADER_CELL_NOTES,
} from "../formStyles.v2";

export default function AddressRowHeader() {
  return (
    <div className={ADDRESS_ROW_HEADER_ROOT}>
<div className={ADDRESS_ROW_HEADER_COLS}>
        <span className={ADDRESS_ROW_HEADER_CELL_RECIPIENT}>Recipient</span>
        <span className={ADDRESS_ROW_HEADER_CELL_QUANTITY}>Quantity</span>
        <span className={ADDRESS_ROW_HEADER_CELL_DELIVERY_EST}>Delivery estimation</span>
        <span className={ADDRESS_ROW_HEADER_CELL_DELIVERY_TIME}>Delivery time</span>
        <span className={ADDRESS_ROW_HEADER_CELL_NOTES}>Notes</span>
      </div>
    </div>
  );
}
