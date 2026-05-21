-- Données initiales : 15 catégories de services
INSERT INTO categories (name, slug, icon_name) VALUES
  ('Menuiserie',    'menuiserie',    'Hammer'),
  ('Plomberie',     'plomberie',     'Wrench'),
  ('Électricité',   'electricite',   'Zap'),
  ('Ménage',        'menage',        'Sparkles'),
  ('Maçonnerie',    'maconnerie',    'Building'),
  ('Peinture',      'peinture',      'Paintbrush'),
  ('Mécanique',     'mecanique',     'Settings'),
  ('Informatique',  'informatique',  'Monitor'),
  ('Couture',       'couture',       'Scissors'),
  ('Coiffure',      'coiffure',      'User'),
  ('Jardinage',     'jardinage',     'Leaf'),
  ('Coursier',      'coursier',      'Bike'),
  ('Climatisation', 'climatisation', 'Wind'),
  ('Sécurité',      'securite',      'Shield'),
  ('Autre',         'autre',         'MoreHorizontal')
ON CONFLICT (slug) DO NOTHING;
