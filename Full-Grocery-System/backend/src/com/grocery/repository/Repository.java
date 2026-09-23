package com.grocery.repository;

import java.util.List;
import com.grocery.exception.DatabaseException;

public interface Repository<T, ID> {
    void create(T entity) throws DatabaseException;
    T readById(ID id) throws DatabaseException;
    List<T> readAll() throws DatabaseException;
    void update(T entity) throws DatabaseException;
    void delete(ID id) throws DatabaseException;
}
