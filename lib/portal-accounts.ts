/** One pixPLace account per content direction; each posts with its own key (50 posts a day per key). */
export interface PortalAccount {
  id: string;
  name: string;
  username: string;
  keyName: string;
  /** Portal category slug; directions without one post with tags only. */
  category?: string;
}

export const PORTAL_ACCOUNTS: PortalAccount[] = [
  { id: "interior", name: "Interior", username: "pixplace_interior", keyName: "PIXPLACE_KEY_INTERIOR", category: "architecture-and-interior-design-ideas" },
  { id: "clipart", name: "Clipart", username: "pixplace_clipart", keyName: "PIXPLACE_KEY_CLIPART", category: "ai-art-assets" },
  { id: "characters", name: "Characters", username: "pixplace_characters", keyName: "PIXPLACE_KEY_CHARACTERS", category: "avatar" },
  { id: "fashion", name: "Fashion", username: "pixplace_fashion", keyName: "PIXPLACE_KEY_FASHION", category: "fashion-trends-ai" },
  { id: "products", name: "Product Assets", username: "pixplace_products", keyName: "PIXPLACE_KEY_PRODUCTS", category: "product-mockups" },
  { id: "architecture", name: "Architecture", username: "pixplace_architecture", keyName: "PIXPLACE_KEY_ARCHITECTURE", category: "architecture-and-interior-design-ideas" },
  { id: "nature", name: "Nature", username: "pixplace_nature", keyName: "PIXPLACE_KEY_NATURE" },
  { id: "animals", name: "Animals", username: "pixplace_animals", keyName: "PIXPLACE_KEY_ANIMALS" },
  { id: "food", name: "Food", username: "pixplace_food", keyName: "PIXPLACE_KEY_FOOD" },
  { id: "beauty", name: "Beauty", username: "pixplace_beauty", keyName: "PIXPLACE_KEY_BEAUTY" },
  { id: "travel", name: "Travel", username: "pixplace_travel", keyName: "PIXPLACE_KEY_TRAVEL" },
  { id: "vehicles", name: "Vehicles", username: "pixplace_vehicles", keyName: "PIXPLACE_KEY_VEHICLES" },
  { id: "fantasy", name: "Fantasy", username: "pixplace_fantasy", keyName: "PIXPLACE_KEY_FANTASY" },
  { id: "abstract", name: "Abstract", username: "pixplace_abstract", keyName: "PIXPLACE_KEY_ABSTRACT" },
  { id: "holidays", name: "Holidays", username: "pixplace_holidays", keyName: "PIXPLACE_KEY_HOLIDAYS" },
  { id: "logos", name: "Branding", username: "pixplace_logos", keyName: "PIXPLACE_KEY_LOGOS" },
  { id: "tech", name: "Tech", username: "pixplace_tech", keyName: "PIXPLACE_KEY_TECH" },
];

export const portalAccount = (id: string) => PORTAL_ACCOUNTS.find((a) => a.id === id);
