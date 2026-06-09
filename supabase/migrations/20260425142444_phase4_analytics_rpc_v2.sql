-- RPC to get top products using normalized sale_items table
CREATE OR REPLACE FUNCTION get_top_products_normalized(limit_count INT DEFAULT 10)
RETURNS TABLE (
    name TEXT,
    qty BIGINT,
    revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.name, si.item_name) as name,
        SUM(si.quantity)::BIGINT as qty,
        SUM(si.subtotal)::NUMERIC as revenue
    FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    GROUP BY COALESCE(p.name, si.item_name)
    ORDER BY revenue DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RPC to get revenue trend using normalized tables
CREATE OR REPLACE FUNCTION get_revenue_trend_normalized(time_range_input TEXT DEFAULT 'WEEKLY')
RETURNS TABLE (
    period TEXT,
    revenue NUMERIC,
    orders BIGINT
) AS $$
BEGIN
    IF time_range_input = 'DAILY' THEN
        RETURN QUERY
        SELECT 
            to_char(created_at, 'HH24:00') as period,
            SUM(total)::NUMERIC as revenue,
            COUNT(*)::BIGINT as orders
        FROM sales
        WHERE created_at >= CURRENT_DATE
        GROUP BY 1
        ORDER BY 1;
    ELSIF time_range_input = 'WEEKLY' THEN
        RETURN QUERY
        SELECT 
            to_char(d, 'Dy') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
        LEFT JOIN sales s ON date_trunc('day', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    ELSIF time_range_input = 'MONTHLY' THEN
        RETURN QUERY
        SELECT 
            to_char(d, 'DD Mon') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) d
        LEFT JOIN sales s ON date_trunc('day', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    ELSE -- YEARLY
        RETURN QUERY
        SELECT 
            to_char(d, 'Mon') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(date_trunc('month', CURRENT_DATE - INTERVAL '11 months'), date_trunc('month', CURRENT_DATE), '1 month'::interval) d
        LEFT JOIN sales s ON date_trunc('month', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    END IF;
END;
$$ LANGUAGE plpgsql;
;
