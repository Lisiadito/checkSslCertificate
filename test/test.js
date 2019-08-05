const expect = require('chai').expect
const checkSslCertificate = require("../dist/index").default

describe('checkSslCertificate', function() {
  it('should resolve when passing only a hostname', async () => {
    const result = await checkSslCertificate({hostname: 'github.com'})
    expect(result).to.be.a('Object')
    expect(result).to.have.property('originalObject')
    expect(result).to.have.property('valid', true)
    expect(result).to.have.property('validFrom')
    expect(result).to.have.property('validUntil')
    expect(result.originalObject).to.have.property('hostname')
    expect(result.originalObject.hostname).to.equal('github.com')
  })

  it('should resolve when passing a different method', async () => {
    const result = await checkSslCertificate({hostname: 'github.com', method: 'GET'})
    expect(result).to.be.a('Object')
    expect(result).to.have.property('originalObject')
    expect(result).to.have.property('valid', true)
    expect(result).to.have.property('validFrom')
    expect(result).to.have.property('validUntil')
    expect(result.originalObject).to.have.property('hostname')
    expect(result.originalObject.hostname).to.equal('github.com')
  })

  it('should resolve with an error when empty hostname is passed', async () => {
    const result = await checkSslCertificate({hostname: ''})
    expect(result).to.have.property('error')
    expect(result.error).to.equal('Host missing')
  })

  it('should resolve with an error when path is contained in the hostname', async () => {
    const result = await checkSslCertificate({hostname: 'github.com/foo'})
    expect(result).to.have.property('error')
  })

  it('should resolve with an error when response code not 200', async () => {
    const result = await checkSslCertificate({hostname: 'httpstat.us', path: '/400'})
    expect(result).to.have.property('error')
    expect(result.error).to.have.equal('400')
  })
})