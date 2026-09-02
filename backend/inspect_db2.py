import sqlite3
conn = sqlite3.connect('octovova_dev.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('Tables:', tables)
for t in tables:
    table_name = t[0]
    cursor.execute(f'SELECT count(*) FROM {table_name}')
    print(table_name, 'count:', cursor.fetchone()[0])
