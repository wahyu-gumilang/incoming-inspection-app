-- Small fixture set for csi_db_test, loaded after the migrations.
-- Items and standards are real csi_db rows chosen to cover every tolerance case:
--   000-228    ±, +x/-0, 'FITTING ' and 'VISUAL' with trailing spaces in values
--   1-1-14-39  Min, CERTIFIKAT
--   1-1-14-03  Max, and standard_txt (' 0.1') disagreeing with standard (10.00)
-- Vendors and checkers are dummy data.

INSERT INTO inventtable (itemid, name, inspectqty) VALUES
('000-228', 'Handle Rhino Prima', 0),
('1-1-14-39', 'Steel Fibre 0.4 x 16 mm', 0),
('1-1-14-03', 'Pasir Galunggung (Sand)', 0);

INSERT INTO inventinspectitem
  (itemid, itemname, inspecttype, inspectitem, standard_txt, standard, tolerance, tolerance_plus, tolerance_minus)
VALUES
('000-228', 'Handle Rhino Prima', 'FITTING ', 'C', 'M8', 0.00, 'Fitting OK', 0.00, 0.00),
('000-228', 'Handle Rhino Prima', 'STD', 'A', ' 12.5', 12.50, '±0.4', 0.40, 0.40),
('000-228', 'Handle Rhino Prima', 'STD', 'B', 'Ø16', 16.00, '+0.3/-0', 0.30, 0.00),
('000-228', 'Handle Rhino Prima', 'STD', 'D', ' 28.0', 28.00, '±0.4', 0.40, 0.40),
('000-228', 'Handle Rhino Prima', 'VISUAL', 'Black ', 'Black ', 0.00, ' 0.0', 0.00, 0.00),
('000-228', 'Handle Rhino Prima', 'VISUAL', 'Cat Rata/Tidak Belang ', 'Cat Rata/Tidak Belang ', 0.00, ' 0.0', 0.00, 0.00),
('000-228', 'Handle Rhino Prima', 'VISUAL', 'Tidak Gores', 'Tidak Gores', 0.00, ' 0.0', 0.00, 0.00),
('1-1-14-39', 'Steel Fibre 0.4 x 16 mm', 'CERTIFIKAT', 'COA NO.', ' 0.0', 0.00, ' 0.0', 0.00, 0.00),
('1-1-14-39', 'Steel Fibre 0.4 x 16 mm', 'STD', 'Diameter ', '0.4 mm', 0.40, '±0.1', 0.10, 0.10),
('1-1-14-39', 'Steel Fibre 0.4 x 16 mm', 'STD', 'Length', '16 mm', 16.00, '±2.0', 2.00, 2.00),
('1-1-14-39', 'Steel Fibre 0.4 x 16 mm', 'STD', 'Tensile Strength ', '1200 N/mm²', 1200.00, 'Min', 0.00, 0.00),
('1-1-14-03', 'Pasir Galunggung (Sand)', 'STD', 'Kadar Lumpur', ' 0.1', 10.00, 'Max', 0.00, 0.00);

INSERT INTO vendtable (vendaccount, name) VALUES
('V-0001', 'PT Sinar Logam Abadi'),
('V-0002', 'CV Maju Teknik Mandiri'),
('V-0003', 'PT Baja Prima Nusantara');

INSERT INTO inspectsetup (checkedby) VALUES
('Budi Santoso'),
('Siti Rahayu');
