export default function HeaderArt() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-[#f6c453]"
      viewBox="0 0 1520 158"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* temple gopuram */}
        <g id="ha-gopuram">
          <path d="M8 116H112" />
          <path d="M14 116V94H106V116" />
          <path d="M22 94L30 76H90L98 94" />
          <path d="M34 76L42 60H78L86 76" />
          <path d="M46 60L52 46H68L74 60" />
          <path d="M54 46L58 34H62L66 46" />
          <path d="M60 34V26" />
          <path d="M55 26C55 19 65 19 65 26Z" />
          <path d="M60 19V10" />
          <path d="M52 116V104a8 8 0 0 1 16 0V116" />
          <path d="M26 112V102a4 4 0 0 1 8 0V112M86 112V102a4 4 0 0 1 8 0V112" />
          <path d="M38 88V82a3 3 0 0 1 6 0V88M76 88V82a3 3 0 0 1 6 0V88M56 72V66a4 4 0 0 1 8 0V72" />
        </g>

        {/* diya */}
        <g id="ha-diya">
          <path d="M10 40H90C90 58 72 68 50 68C28 68 10 58 10 40Z" />
          <path d="M50 38C40 28 40 16 50 4C60 16 60 28 50 38Z" />
          <path d="M50 30C46 25 46 20 50 14C54 20 54 25 50 30Z" />
          <path d="M22 50C34 56 66 56 78 50" />
          <path d="M34 68H66M40 72H60" />
        </g>

        {/* dhupkati: incense burner with sticks and smoke */}
        <g id="ha-dhupkati">
          <path d="M40 56L34 34M50 56V30M60 56L66 34" />
          <path d="M34 34C28 28 40 24 34 18C30 14 36 10 33 6" />
          <path d="M50 30C44 24 56 20 50 14C46 10 52 6 50 2" />
          <path d="M66 34C60 28 72 24 66 18C62 14 68 10 66 6" />
          <path d="M20 56H80" />
          <path d="M24 56C24 68 36 76 50 76C64 76 76 68 76 56" />
          <path d="M32 64H68" />
          <path d="M50 76V90" />
          <path d="M32 104C32 96 40 90 50 90C60 90 68 96 68 104Z" />
          <path d="M28 104H72" />
        </g>

        {/* kalash with mango leaves and coconut */}
        <g id="ha-kalash">
          <path d="M28 38H52V46C62 52 66 62 62 72C58 84 50 90 40 90C30 90 22 84 18 72C14 62 18 52 28 46Z" />
          <path d="M24 38H56" />
          <path d="M20 62H60" />
          <path d="M31 30C31 18 49 18 49 30C49 38 31 38 31 30Z" />
          <path d="M40 20C26 18 18 24 14 32C26 34 34 30 40 20Z" />
          <path d="M40 20C54 18 62 24 66 32C54 34 46 30 40 20Z" />
        </g>

        {/* temple bell */}
        <g id="ha-bell">
          <path d="M30 0V8" />
          <path d="M25 14C25 6 35 6 35 14" />
          <path d="M12 56C12 32 20 16 30 16C40 16 48 32 48 56" />
          <path d="M6 56H54C54 62 50 64 46 64H14C10 64 6 62 6 56Z" />
          <path d="M16 44H44" />
          <path d="M30 64V70" />
          <circle cx="30" cy="74" r="3" />
        </g>

        {/* sparkle */}
        <path id="ha-star" d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />
      </defs>

      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
        <use href="#ha-kalash" transform="translate(6 54) scale(.85)" />
        <use href="#ha-diya" transform="translate(262 62) scale(.75)" />
        <use href="#ha-gopuram" transform="translate(404 -4) scale(.85)" />
        <use href="#ha-dhupkati" transform="translate(984 26) scale(.95)" />
        <use href="#ha-bell" transform="translate(1460 38) scale(.8)" />
        <use href="#ha-diya" transform="translate(1462 112) scale(.5)" />
      </g>

      <g fill="currentColor" stroke="none" opacity="0.35">
        <use href="#ha-star" transform="translate(300 24) scale(.6)" />
        <use href="#ha-star" transform="translate(520 126) scale(.5)" />
        <use href="#ha-star" transform="translate(948 18) scale(.5)" />
        <use href="#ha-star" transform="translate(1100 124) scale(.6)" />
        <use href="#ha-star" transform="translate(1436 26) scale(.5)" />
        <use href="#ha-star" transform="translate(84 20) scale(.5)" />
      </g>
    </svg>
  );
}