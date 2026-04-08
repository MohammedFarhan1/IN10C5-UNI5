do $$
declare
  seller_uuid uuid;
begin
  select id
  into seller_uuid
  from public.users
  where email = 'sellerdemo@gmail.com'
    and role = 'seller'
  limit 1;

  if seller_uuid is null then
    raise exception 'Seller sellerdemo@gmail.com with role=seller was not found in public.users.';
  end if;

  with sample_products(custom_product_id, name, description, price, total_units, image_url) as (
    values
      ('WCH-001-BLK-010', 'Veri One Smart Watch', 'Premium AMOLED smartwatch with heart-rate monitoring, GPS, and all-day battery life.', 4999, 8, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'),
      ('AUD-002-WHT-032', 'AeroBuds Pro', 'Wireless earbuds with active noise cancellation, clear call quality, and compact charging case.', 2999, 10, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80'),
      ('FIT-003-BLK-016', 'NovaFit Band X', 'Lightweight fitness tracker with sleep analytics, step tracking, and water resistance.', 1899, 12, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd4b6?auto=format&fit=crop&w=1200&q=80'),
      ('SPK-004-BLK-012', 'UrbanSound Speaker Mini', 'Portable Bluetooth speaker with punchy bass, USB-C charging, and 12-hour playback.', 2499, 7, 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1200&q=80'),
      ('TAB-005-SLV-064', 'PixelView 10 Tablet', '10-inch multimedia tablet with vibrant display, dual speakers, and long battery backup.', 11999, 6, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-006-BLK-000', 'SnapLite Phone Stand', 'Foldable metal stand for phones and small tablets with adjustable viewing angles.', 699, 15, 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-007-BRN-000', 'Terra Leather Wallet', 'Slim genuine leather wallet with RFID protection and multiple card compartments.', 1599, 9, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80'),
      ('SPT-008-BLK-000', 'StrideX Running Shoes', 'Breathable running shoes with cushioned sole built for daily workouts and casual wear.', 3499, 11, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80'),
      ('HME-009-WHT-000', 'Luma Desk Lamp', 'Minimal LED desk lamp with touch controls, warm light modes, and sleek matte finish.', 2199, 8, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
      ('HME-010-BLU-001', 'EcoSip Bottle 1L', 'Stainless steel insulated bottle that keeps drinks cold for 24 hours and hot for 12 hours.', 999, 14, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-011-GRY-000', 'Canvas Tote Prime', 'Durable everyday tote bag with reinforced handles and spacious interior pocket.', 1299, 10, 'https://images.unsplash.com/photo-1542291026-c5d6d9a63ea8?auto=format&fit=crop&w=1200&q=80'),
      ('HME-012-WHT-000', 'Aurora Night Lamp', 'Soft ambient bedside lamp designed for cozy lighting and modern room decor.', 1799, 7, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-013-BLK-000', 'Fusion Power Bank 20000', 'High-capacity power bank with dual USB output, fast charging, and battery indicators.', 2299, 9, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-014-BLK-000', 'Vista Laptop Sleeve', 'Water-resistant laptop sleeve with soft padded lining for 13-inch and 14-inch devices.', 1399, 12, 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-015-BLK-000', 'Orbit Wireless Mouse', 'Ergonomic wireless mouse with silent clicks and adjustable DPI sensitivity.', 1199, 10, 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-016-BLK-000', 'KeyGlow Mechanical Keyboard', 'Compact mechanical keyboard with tactile switches and subtle white backlighting.', 4599, 6, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80'),
      ('HME-017-WHT-000', 'Breeze Neck Fan', 'Rechargeable personal neck fan with low-noise airflow and three-speed adjustment.', 1499, 11, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=80'),
      ('HME-018-WHT-000', 'Mellow Brew Mug Set', 'Ceramic coffee mug set with matte finish suitable for home and office use.', 899, 13, 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=1200&q=80'),
      ('HME-019-GRY-000', 'CloudRest Pillow', 'Memory foam pillow crafted for neck support and better sleep posture.', 1999, 8, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
      ('HME-020-WHT-000', 'PureAir Diffuser', 'Compact aroma diffuser with soft mist output and warm ambient lighting.', 1699, 9, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-021-BLK-000', 'Spark Grooming Trimmer', 'Precision beard and hair trimmer with multiple guard settings and USB charging.', 2599, 7, 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-022-GRN-000', 'Roam Cabin Backpack', 'Travel-friendly backpack with laptop sleeve, hidden pockets, and padded straps.', 3299, 10, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'),
      ('SPT-023-PNK-000', 'Zen Yoga Mat', 'Non-slip exercise mat with extra cushioning for yoga, stretching, and home workouts.', 1499, 12, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-024-BLK-000', 'ClipGo Selfie Stick', 'Extendable selfie stick tripod with Bluetooth shutter for quick content capture.', 799, 14, 'https://images.unsplash.com/photo-1519183071298-a2962be96c66?auto=format&fit=crop&w=1200&q=80'),
      ('HME-025-SLV-000', 'Core Steel Kettle', 'Electric kettle with rapid boil feature, auto shut-off, and cool-touch handle.', 1899, 8, 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80'),
      ('HME-026-SLV-000', 'PrimeCut Chef Knife', 'Balanced stainless-steel chef knife built for precision chopping and slicing.', 2399, 6, 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-027-WHT-000', 'GlowMirror Mini', 'Portable vanity mirror with LED ring light and foldable stand.', 1299, 11, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'),
      ('HME-028-TAN-000', 'Nest Storage Basket', 'Woven multipurpose basket for home organization, toys, or laundry essentials.', 999, 13, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-029-BLK-000', 'Volt Car Charger', 'Dual-port fast charger for cars with smart power distribution and compact body.', 699, 15, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80'),
      ('HME-030-WHT-000', 'SilkTouch Bedsheet Set', 'Soft microfiber bedsheet set with pillow covers and wrinkle-resistant finish.', 2199, 9, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
      ('HME-031-BLK-000', 'ChefMate Fry Pan', 'Non-stick fry pan with even heat distribution and ergonomic soft-grip handle.', 1899, 10, 'https://images.unsplash.com/photo-1584990347449-5c2d4a59b42d?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-032-BLK-000', 'Pocket Journal Pro', 'Premium hardcover journal for planning, sketching, and note-taking on the go.', 599, 16, 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-033-BLK-000', 'MagSnap Phone Case', 'Shock-absorbing phone case with magnetic ring support and slim profile.', 999, 14, 'https://images.unsplash.com/photo-1603314585442-ee3b3c16fbcf?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-034-BLK-000', 'Drift Sunglasses', 'UV-protected casual sunglasses with lightweight frame and timeless styling.', 1499, 8, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80'),
      ('HME-035-GRY-000', 'FreshPrep Lunch Box', 'Leak-resistant lunch box with divided compartments and microwave-safe build.', 849, 12, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'),
      ('SPT-036-RED-000', 'Motion Jump Rope', 'Adjustable jump rope with smooth bearings and foam handles for cardio sessions.', 499, 18, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80'),
      ('HME-037-BLK-000', 'HomeCharge Extension Hub', 'Multi-socket extension board with surge protection and USB charging ports.', 1599, 9, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80'),
      ('HME-038-BRN-000', 'Cedar Beard Care Kit', 'Beard grooming set with oil, balm, brush, and compact travel pouch.', 1999, 7, 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1200&q=80'),
      ('HME-039-RED-000', 'Bloom Table Runner', 'Decorative table runner with textured fabric finish for dining and festive setups.', 1099, 10, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'),
      ('ACC-040-PNK-000', 'QuickDry Hair Wrap', 'Soft microfiber hair wrap towel designed for fast drying and reduced frizz.', 699, 15, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80')
  ),
  inserted_products as (
    insert into public.products (
      seller_id,
      custom_product_id,
      name,
      description,
      price,
      image_url,
      total_units
    )
    select
      seller_uuid,
      sp.custom_product_id,
      sp.name,
      sp.description,
      sp.price,
      sp.image_url,
      sp.total_units
    from sample_products sp
    returning id, total_units
  )
  insert into public.product_units (
    product_id,
    unit_code,
    status
  )
  select
    ip.id,
    concat('SKU-', left(ip.id::text, 8), '-', lpad(gs::text, 3, '0'))::text,
    'available'
  from inserted_products ip
  cross join lateral generate_series(1, ip.total_units) as gs;
end $$;
