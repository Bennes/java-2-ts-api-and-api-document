package com.zengxiao.base.web.dto;

public class BaseResult<T> {
  /**
   * 错误编号,0为正确
   */
  @NotNull
  private int errorNo = 0;
  /**
   * 错误信息
   */
  private String errorMsg = null;

  /**
   * 返回结果
   */
  private T result;

  public BaseResult(T r) {
    this.result = r;
  }

  /**
   * @return the errorNo
   */
  public int getErrorNo() {
    return errorNo;
  }

  /**
   * @param errorNo the errorNo to set
   */
  public void setErrorNo(int errorNo) {
    this.errorNo = errorNo;
  }

  /**
   * @return the errorMsg
   */
  public String getErrorMsg() {
    return errorMsg;
  }

  /**
   * @param errorMsg the errorMsg to set
   */
  public void setErrorMsg(String errorMsg) {
    this.errorMsg = errorMsg;
  }

  /**
   * @return the result
   */
  public T getResult() {
    return result;
  }

  /**
   * @param result the result to set
   */
  public void setResult(T result) {
    this.result = result;
  }

}