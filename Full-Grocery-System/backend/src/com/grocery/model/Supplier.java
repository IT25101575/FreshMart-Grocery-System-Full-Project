package com.grocery.model;

public class Supplier {
    private int id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private String contractTerms;
    private boolean isActive;

    public Supplier() {}

    public Supplier(int id, String companyName, String contactPerson, String email, String phone, String address, String contractTerms, boolean isActive) {
        this.id = id;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.contractTerms = contractTerms;
        this.isActive = isActive;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContractTerms() { return contractTerms; }
    public void setContractTerms(String contractTerms) { this.contractTerms = contractTerms; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
