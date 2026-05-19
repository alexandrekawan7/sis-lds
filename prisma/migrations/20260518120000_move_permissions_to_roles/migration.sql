-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- Migrate existing user-level permissions to role-level permissions
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT DISTINCT ptu."A", u."roleId"
FROM "_PermissionToUser" ptu
INNER JOIN "User" u ON u."id" = ptu."B"
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "_PermissionToRole"
ADD CONSTRAINT "_PermissionToRole_A_fkey"
FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole"
ADD CONSTRAINT "_PermissionToRole_B_fkey"
FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
DROP TABLE "_PermissionToUser";
