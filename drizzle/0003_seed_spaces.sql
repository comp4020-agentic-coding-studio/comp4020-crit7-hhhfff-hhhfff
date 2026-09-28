-- The bookable spaces. Library names, the Chifley Level 2 computer desks and
-- Level 3 study booths, and the Hancock basement room come from ANU Library's
-- public pages; room numbers, capacities and features are illustrative.
INSERT INTO `spaces` (`slug`, `name`, `library`, `kind`, `capacity`, `features`) VALUES
  ('chifley-gr-1', 'Group Room 1', 'Chifley', 'group', 6, 'Screen, whiteboard'),
  ('chifley-gr-2', 'Group Room 2', 'Chifley', 'group', 6, 'Screen, whiteboard'),
  ('chifley-gr-3', 'Group Room 3', 'Chifley', 'group', 4, 'Whiteboard'),
  ('chifley-gr-4', 'Group Room 4', 'Chifley', 'group', 8, 'Screen, whiteboard'),
  ('chifley-desk-1', 'Computer Desk L2-1', 'Chifley', 'seat', 1, 'PC, Level 2'),
  ('chifley-desk-2', 'Computer Desk L2-2', 'Chifley', 'seat', 1, 'PC, Level 2'),
  ('chifley-booth-1', 'Study Booth L3-1', 'Chifley', 'seat', 1, 'Quiet, Level 3'),
  ('chifley-booth-2', 'Study Booth L3-2', 'Chifley', 'seat', 1, 'Quiet, Level 3'),
  ('hancock-gr-1', 'Group Room 1', 'Hancock', 'group', 6, 'Screen, whiteboard'),
  ('hancock-gr-2', 'Group Room 2', 'Hancock', 'group', 4, 'Whiteboard'),
  ('hancock-gr-3', 'Group Room 3', 'Hancock', 'group', 6, 'Screen'),
  ('hancock-basement', 'Basement Study Room', 'Hancock', 'group', 8, 'Whiteboard, no power outlets, not wheelchair accessible'),
  ('menzies-gr-1', 'Group Room 1', 'Menzies', 'group', 6, 'Screen, whiteboard'),
  ('menzies-gr-2', 'Group Room 2', 'Menzies', 'group', 4, 'Whiteboard'),
  ('menzies-gr-3', 'Group Room 3', 'Menzies', 'group', 10, 'Screen, whiteboard, video conferencing');
