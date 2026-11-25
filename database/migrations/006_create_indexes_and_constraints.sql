-- Migration 006: Performance indexes and integrity CHECK constraints
-- Requires MySQL 8.0.16+ for CHECK constraint enforcement

SET NAMES utf8mb4;

-- Catalog & technical attribute indexes
CREATE INDEX idx_products_category_active ON products (category_id, is_active);
CREATE INDEX idx_products_brand_active ON products (brand_id, is_active);
CREATE INDEX idx_products_active_price ON products (is_active, price);
CREATE INDEX idx_product_attributes_key_value ON product_attributes (attribute_key, attribute_value);

-- Cart & stock reservation indexes
CREATE INDEX idx_carts_session_token_hash ON carts (session_token_hash);
CREATE INDEX idx_carts_expires_at ON carts (expires_at);
CREATE INDEX idx_stock_reservations_status_expires ON stock_reservations (status, expires_at);
CREATE INDEX idx_stock_reservations_cart_status ON stock_reservations (cart_id, status);

-- Orders & tracking indexes
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);
CREATE INDEX idx_orders_number_email ON orders (order_number, customer_email);
CREATE INDEX idx_orders_status_created ON orders (status, created_at);

-- Support & legal indexes
CREATE INDEX idx_support_tickets_user_status ON support_tickets (user_id, status);
CREATE INDEX idx_support_tickets_code_email ON support_tickets (ticket_code, contact_email);
CREATE INDEX idx_faq_items_topic_active_sort ON faq_items (topic, is_active, sort_order);
CREATE INDEX idx_cookie_consents_token_hash ON cookie_consents (consent_token_hash);

-- Integrity CHECK constraints
ALTER TABLE products
  ADD CONSTRAINT chk_products_units_per_pack CHECK (units_per_pack >= 1),
  ADD CONSTRAINT chk_products_price CHECK (price >= 0.00),
  ADD CONSTRAINT chk_products_stock_available CHECK (stock_available >= 0),
  ADD CONSTRAINT chk_products_stock_reserved CHECK (stock_reserved >= 0);

ALTER TABLE cart_items
  ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0);

ALTER TABLE stock_reservations
  ADD CONSTRAINT chk_stock_reservations_quantity CHECK (quantity > 0);

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0.00),
  ADD CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0.00),
  ADD CONSTRAINT chk_orders_shipping CHECK (shipping_cost >= 0.00),
  ADD CONSTRAINT chk_orders_tax CHECK (tax_amount >= 0.00),
  ADD CONSTRAINT chk_orders_total CHECK (total_amount >= 0.00);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_unit_price CHECK (unit_price_snapshot >= 0.00),
  ADD CONSTRAINT chk_order_items_line_total CHECK (line_total >= 0.00);
