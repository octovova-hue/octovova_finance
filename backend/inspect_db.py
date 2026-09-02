import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine('sqlite+aiosqlite:///./octovova_dev.db')
    async with engine.connect() as conn:
        res = await conn.execute(text('SELECT customer_id, name FROM customer'))
        customers = res.fetchall()
        print('Customers:', customers)
        for c in customers:
            cid = c[0]
            inc = await conn.execute(text(f"SELECT source, monthly_amount FROM income WHERE customer_id='{cid}'"))
            print('  Income:', inc.fetchall())
            exp = await conn.execute(text(f"SELECT category, monthly_amount FROM expense WHERE customer_id='{cid}'"))
            print('  Expense:', exp.fetchall())
            goals = await conn.execute(text(f"SELECT name, target_year, today_cost FROM financial_goal WHERE customer_id='{cid}'"))
            print('  Goals:', goals.fetchall())

asyncio.run(run())
