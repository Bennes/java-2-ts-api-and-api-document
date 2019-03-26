package com.zengxiao.login.web.dto;

import java.util.*;

public class UserInfo {
  /**
   * 姓名
   */
  @NotNull
  private String name;
  /**
   * 用户创建日期
   */
  @NotNull
  private Date createDateTime;
  /**
   * 用户年龄
   */
  private int older;
  /**
   * 有权限的菜单列表
   */
  private List<String> menu;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Date getCreateDateTime() {
    return createDateTime;
  }

  public void setCreateDateTime(Date createDateTime) {
    this.createDateTime = createDateTime;
  }

  public int getOlder() {
    return older;
  }

  public void setOlder(int older) {
    this.older = older;
  }

  public List<String> getMenu() {
    return menu;
  }

  public void setMenu(List<String> menu) {
    this.menu = menu;
  }

}