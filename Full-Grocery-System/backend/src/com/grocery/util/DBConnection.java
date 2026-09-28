package com.grocery.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String HOST;
    private static final String URL;
    private static final String USER = "sa";
    private static final String PASSWORD = "FreshMart@2026!";

    static {
        String envHost = System.getenv("DB_HOST");
        HOST = (envHost != null && !envHost.trim().isEmpty()) ? envHost.trim() : "localhost";
        URL = "jdbc:sqlserver://" + HOST + ":1433;databaseName=FreshMartDB;encrypt=true;trustServerCertificate=true;";

        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection] Driver class not found: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        SQLException lastEx = null;
        for (int attempt = 1; attempt <= 5; attempt++) {
            try {
                Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
                try (java.sql.Statement st = conn.createStatement()) {
                    st.execute("SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;");
                }
                return conn;
            } catch (SQLException e) {
                lastEx = e;
                if (attempt < 5) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ignored) {}
                }
            }
        }
        throw lastEx;
    }
}
