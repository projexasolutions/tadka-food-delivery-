-- Tadka Food Delivery — Build 13 demo seed
-- Run after 0001_initial.sql in a fresh Supabase project.
-- Demo rows are intentionally public discovery data. No passwords/users are created here.

insert into public.restaurants (id,name,cuisine,description,image_url,rating,delivery_fee,is_open)
values
('10000000-0000-0000-0000-000000000001','Spice Hub','North Indian','Comforting biryani, curries and breads.','',4.5,39,true),
('10000000-0000-0000-0000-000000000002','The Pizza Town','Italian','Stone-baked pizzas and sides.','',4.3,49,true),
('10000000-0000-0000-0000-000000000003','Bowl & Beyond','Chinese','Rice bowls, noodles and quick meals.','',4.4,39,true)
on conflict (id) do update set name=excluded.name,cuisine=excluded.cuisine,description=excluded.description,rating=excluded.rating,delivery_fee=excluded.delivery_fee,is_open=excluded.is_open;

insert into public.categories (id,restaurant_id,name)
values
('20000000-0000-0000-0000-000000000001',null,'Biryani'),
('20000000-0000-0000-0000-000000000002',null,'Main Course'),
('20000000-0000-0000-0000-000000000003',null,'Breads'),
('20000000-0000-0000-0000-000000000004',null,'Pizza'),
('20000000-0000-0000-0000-000000000005',null,'Chinese')
on conflict (id) do update set name=excluded.name;

insert into public.menu_items (id,restaurant_id,category_id,name,description,price,image_url,is_available)
values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Chicken Biryani','Aromatic basmati rice with tender chicken.',280,'',true),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Paneer Butter Masala','Creamy tomato gravy with paneer.',240,'',true),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','Garlic Naan','Soft naan with garlic and herbs.',60,'',true),
('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004','Farmhouse Pizza','Loaded pizza with fresh vegetables.',300,'',true),
('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000005','Veg Noodle Bowl','Quick wok-tossed noodles and vegetables.',220,'',true)
on conflict (id) do update set name=excluded.name,price=excluded.price,is_available=excluded.is_available;
