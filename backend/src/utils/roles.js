const ROLES = {
  ADMIN: 'admin',
  SUB_ADMIN: 'hr_manager',
  LECTURER: 'instructor',
  USER: 'learner',
};

const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  super_admin: ROLES.ADMIN,
  sub_admin: ROLES.SUB_ADMIN,
  hr_manager: ROLES.SUB_ADMIN,
  lecturer: ROLES.LECTURER,
  instructor: ROLES.LECTURER,
  user: ROLES.USER,
  learner: ROLES.USER,
};

const normalizeRole = (role = ROLES.USER) => ROLE_ALIASES[role] || role;

const canManageRole = (actorRole, targetRole) => {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  if (actor === ROLES.ADMIN) return true;
  if (actor === ROLES.SUB_ADMIN) return [ROLES.USER, ROLES.LECTURER].includes(target);
  return false;
};

module.exports = {
  ROLES,
  normalizeRole,
  canManageRole,
};
