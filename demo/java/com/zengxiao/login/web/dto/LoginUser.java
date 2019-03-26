package com.zengxiao.login.web.dto;

public class LoginUser {
  /**
   * 用户名
   */
  @Validator({ ValidType.NOT_BLANK })
  private String userName;
  /**
   * 密码
   */
  @Validator({ ValidType.NOT_BLANK })
  private String pwd;

  /**
   * @return the userName
   */
  public String getUserName() {
    return userName;
  }

  /**
   * @param userName the userName to set
   */
  public void setUserName(String userName) {
    this.userName = userName;
  }

  /**
   * @return the pwd
   */
  public String getPwd() {
    return pwd;
  }

  /**
   * @param pwd the pwd to set
   */
  public void setPwd(String pwd) {
    this.pwd = pwd;
  }

}