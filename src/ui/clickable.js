// Style reset for elements that are semantically buttons.
//
// Every choice in these flows — a location, a barber, a service, a day, a slot — is a
// control, so it is a <button>. That is what makes the flow reachable with the Tab key
// and announced to a screen reader; a <div> with an onClick handler is neither, however
// well it works under a finger.
//
// A button brings its own borders, padding, font and centring, so spread this first and
// let the element's own style follow and win:
//
//   style={{ ...clickable, ...row(selected) }}
export const clickable = {
  appearance: "none",
  WebkitAppearance: "none",
  background: "none",
  border: 0,
  margin: 0,
  padding: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  display: "block",
  width: "100%",
  cursor: "pointer",
};
