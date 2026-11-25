#!/bin/sh
set -eu

DB_DIR="/opt/libreria-db"

for sql_file in "$DB_DIR"/migrations/*.sql "$DB_DIR"/seeds/*.sql; do
  if [ -f "$sql_file" ]; then
    echo "Executing $sql_file..."
    MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root "$MYSQL_DATABASE" < "$sql_file"
  fi
done
