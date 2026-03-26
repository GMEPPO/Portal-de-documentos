insert into document_categories (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'Acordo Comercial'),
  ('22222222-2222-2222-2222-222222222222', 'Apresentacao Institucional'),
  ('33333333-3333-3333-3333-333333333333', 'Ata de Reuniao'),
  ('44444444-4444-4444-4444-444444444444', 'Comunicado Interno'),
  ('55555555-5555-5555-5555-555555555555', 'Financeiro'),
  ('66666666-6666-6666-6666-666666666666', 'Formulario de Pedido'),
  ('77777777-7777-7777-7777-777777777777', 'Instrucao de Trabalho'),
  ('88888888-8888-8888-8888-888888888888', 'Nomenclatura'),
  ('99999999-9999-9999-9999-999999999999', 'Procedimento Especifico'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Procedimento Geral'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Processo'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'RH')
on conflict (id) do update
set name = excluded.name;
